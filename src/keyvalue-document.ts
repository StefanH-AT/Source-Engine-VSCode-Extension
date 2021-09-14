import { CancellationToken, DocumentFormattingEditProvider, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit, workspace } from "vscode";
import { KvTokensProviderBase } from "./keyvalue-parser/kv-token-provider-base";
import { Token, TokenType } from "./keyvalue-parser/kv-tokenizer";

const keyvalueDocuments: { file: string, document: KeyvalueDocument }[] = [];

export function getDocument(document: TextDocument): KeyvalueDocument | undefined {
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
        const edits: TextEdit[] = [];

        for(let i = 0; i < tokens.length; i++) {

            const token = tokens[i];
                        
            if(token.type === TokenType.ObjectStart) indentation++;
            if(token.type === TokenType.ObjectEnd) indentation--;

            const startPos = document.positionAt(token.start);
            const line = document.lineAt(startPos.line);
            const lineTokens = kvDoc.findTokensInRange(line.range);
            
            for(var tabs = ""; tabs.length < indentation; tabs += "\t") {}

            if(token.type === TokenType.Key || token.type === TokenType.ObjectEnd || token.type === TokenType.Comment) {
                const edit = new TextEdit(line.range.with(undefined, line.range.start.translate(0, line.firstNonWhitespaceCharacterIndex)), tabs);
                edits.push(edit);
            }
            if(token.type === TokenType.ObjectStart) {
                const keyToken = tokens[i - 1];
                if(keyToken == null) continue;

                // Get range between key and { and replace it with what we need
                let keyBraceRange = new Range(document.positionAt(keyToken.end), document.positionAt(token.start));
                
                const edit = new TextEdit(keyBraceRange, this.doPutBracesOnNewline() ? `\n${tabs.substring(1)}` : ' '); // Chop off 1 \t, we're the opening {
                edits.push(edit);
                
            }
            
        }

        return edits;

    }

}