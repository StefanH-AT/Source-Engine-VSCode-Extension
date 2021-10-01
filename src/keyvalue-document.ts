// ==========================================================================
// Purpose:
// Provides easy and fast access to keyvalue file token data.
// The VSCode API provides no way of retrieving semantic token data on providers like ColorFormattingProvider as it's stateless.
// This file provides a map stores the token data for each open keyvalue file. There are also extra utility functions to read the token data of the document.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { CancellationToken, commands, DocumentFormattingEditProvider, FormattingOptions, OnTypeFormattingEditProvider, Position, ProviderResult, Range, TextDocument, TextEdit, workspace } from "vscode";
import { KvTokensProviderBase } from "./keyvalue-parser/kv-token-provider-base";
import { Token, Tokenizer, TokenType } from "./keyvalue-parser/kv-tokenizer";

const keyvalueDocuments: { file: string, document: KeyvalueDocument }[] = [];
const tokenizer = new Tokenizer();

export function getDocument(document: TextDocument): KeyvalueDocument | undefined {
    if(!hasDocument(document)) {
        tokenizeDocument(document);
    }
    return keyvalueDocuments.find(d => d.file === document.uri.path)?.document;
}

export function hasDocument(document: TextDocument): boolean {
    return keyvalueDocuments.some(d => d.file === document.uri.path);
}

export function addDocument(document: TextDocument, tokens: Token[]): void {
    const kvDoc = new KeyvalueDocument(document, tokens);
    if(hasDocument(document)) {
        const kvd = keyvalueDocuments.find(kd => kd.file);
        if(kvd == null) return;
        kvd.document = kvDoc;
    } else {
        keyvalueDocuments.push({ file: document.uri.path, document: kvDoc });
    }
}

export function tokenizeDocument(document: TextDocument): Token[] {
    const text = document.getText();
    tokenizer.tokenizeFile(text);
    const tokens = tokenizer.tokens;

    addDocument(document, tokens);
    return tokens;
}

export class KeyvalueDocument {

    protected _document: TextDocument;
    protected _tokens: Token[];
    
    public get document() : TextDocument {
        return this._document;
    }
    
    constructor(document: TextDocument, tokens: Token[]) {
        this._document = document;
        this._tokens = tokens;
    }

    public getKeyValueAt(lineNumber: number) : KeyValue | null {

        const line = this._document.lineAt(lineNumber);
        if(line.isEmptyOrWhitespace) return null;

        const range = line.range;
        const tokens = this.findTokensInRange(range);

        // FIXME: Very repetetive code
        if(tokens.length == 2 && tokens[0].type === TokenType.Key && tokens[1].type === TokenType.Value) {
            const key = tokens[0].value;
            const value = tokens[1].value;
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            const valueRange = new Range(this.document.positionAt(tokens[1].start), this.document.positionAt(tokens[1].end));

            const unquotedKey = KvTokensProviderBase.unquoteToken(tokens[0], keyRange, null);
            const unquotedValue = KvTokensProviderBase.unquoteToken(tokens[1], valueRange, null);
            return new KeyValue(unquotedKey.content, unquotedValue.content, unquotedKey.range, unquotedValue.range);
        }

        if(tokens.length == 1 && tokens[0].type === TokenType.Key) {
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            const unquoted = KvTokensProviderBase.unquoteToken(tokens[0], keyRange, null);
            return new KeyValue(unquoted.content, "", unquoted.range, keyRange.with(keyRange.end, keyRange.end.translate(1)));
        }

        return null;
        
    }

    public getAllValueTokens(): Token[] {
        return this._tokens.filter(t => t.type === TokenType.Value);
    }

    public getAllTokens(): Token[] {
        return this._tokens;
    }

    public findTokensInRange(range: Range): Token[] {
        
        return this._tokens.filter(t => {
            let startPos = this._document.positionAt(t.start);
            let endPos = this.document.positionAt(t.end);
            return startPos.isAfterOrEqual(range.start) && startPos.isBefore(range.end) && endPos.isAfter(range.start) && endPos.isBeforeOrEqual(range.end);
        });

    }

}

export class KeyValue {

    public key: string;
    public keyRange: Range;
    public value: string;
    public valueRange: Range;

    constructor(key: string, value: string, keyRange: Range, valueRange: Range) {
        this.key = key;
        this.value = value;
        this.keyRange = keyRange;
        this.valueRange = valueRange;
    }

}


export class KeyvalueDocumentFormatter implements DocumentFormattingEditProvider {



    protected doPutBracesOnNewline(): boolean {
        const config = workspace.getConfiguration("sourceEngine");
        return config.get("keyvalueBracesOnNewline") ?? false;
    }

    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): TextEdit[] {

        const kvDoc = getDocument(document);
        if(kvDoc == null) return [];

        const tokens = kvDoc.getAllTokens();
        
        let indentation = 0;

        const startPos = document.positionAt(0);
        
        // We just delete and reconstruct the entire file. Much easier.
        const edits: TextEdit[] = [ 
            new TextEdit( new Range(startPos, document.positionAt(document.getText().length)), "" )
        ];

        const bracketOnNewline = this.doPutBracesOnNewline();

        let text = "";

        for(let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            const indent = "\t".repeat(indentation);

            if(token.type === TokenType.ObjectStart) {
                indentation++;
                if(text.endsWith("\n")) {
                    text += indent + "{\n";
                    continue;
                }
                if(bracketOnNewline) {
                    text += "\n" + indent + "{\n";
                } else {
                    text += " {\n";
                }
            } else if(token.type === TokenType.ObjectEnd) {
                indentation--;
                text += indent.substring(1) + "}\n";
            } else if(token.type === TokenType.Key) {
                text += indent + token.value;
            } else if(token.type === TokenType.Value) {
                text += " " + token.value + "\n";
            } else if(token.type === TokenType.Comment) {
                const val = token.value;
                text += indent + "// " + val.substring(2).trimStart() + "\n";
            }

        }

        edits.push(new TextEdit(new Range(startPos, startPos), text));

        return edits;

    }

}