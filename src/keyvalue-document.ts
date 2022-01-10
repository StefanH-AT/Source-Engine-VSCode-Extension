// ==========================================================================
// Purpose:
// Provides easy and fast access to keyvalue file token data.
// The VSCode API provides no way of retrieving semantic token data on providers like ColorFormattingProvider as it's stateless.
// This file provides a map stores the token data for each open keyvalue file. There are also extra utility functions to read the token data of the document.
// ==========================================================================

import { CancellationToken, commands, Diagnostic, DiagnosticCollection, DiagnosticSeverity, DocumentFormattingEditProvider, DocumentSemanticTokensProvider, Event, FormattingOptions, OnTypeFormattingEditProvider, Position, ProviderResult, Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument, TextEdit, workspace } from "vscode";
import { formatTokens } from "./kv-core/kv-formatter";
import { isQuoted, stripQuotes } from "./kv-core/kv-string-util";
import { Token, Tokenizer, TokenType } from "./kv-core/kv-tokenizer";

const keyvalueDocuments: { file: string, document: KeyvalueDocument }[] = [];
const tokenizer = new Tokenizer();

export const legend = new SemanticTokensLegend([
    "struct",
    "comment",
    "variable",
    "string",
    "number",
    "operator",
    "macro",
    "boolean",
    "keyword",
    "parameter"
], [
    "declaration",
    "readonly"
]);

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
        const tokens = this.findTokensOnLine(lineNumber);

        // Normal old keyvalue
        if(tokens.length == 2 && tokens[0].type === TokenType.Key && tokens[1].type === TokenType.Value) {
            const unquotedKey = this.getUnquotedToken(tokens[0]);
            const unquotedValue = this.getUnquotedToken(tokens[1]);
            return new KeyValue(unquotedKey.content, unquotedValue.content, unquotedKey.range, unquotedValue.range);
        }
        
        // Key without value :'(
        if(tokens.length == 1 && tokens[0].type === TokenType.Key) {
            const keyRange = this.getTokenRange(tokens[0]);
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

    public findTokensOnLine(line: number): Token[] {
        return this._tokens.filter(t => t.line == line);
    }

    private getTokenRange(token: Token): Range {
        return new Range(this.document.positionAt(token.start), this.document.positionAt(token.end));
    }

    private getUnquotedToken(token: Token): { content: string, range: Range } {
        const range = this.getTokenRange(token);
        return KvTokensProviderBase.unquoteToken(token, range, null);
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
        const startPos = document.positionAt(0);
        
        // We just delete and reconstruct the entire file. Much easier.
        const edits: TextEdit[] = [ 
            new TextEdit( new Range(startPos, document.positionAt(document.getText().length)), "" )
        ];     

        edits.push(new TextEdit(new Range(startPos, startPos), formatTokens(tokens, this.doPutBracesOnNewline())));

        return edits;

    }

}


export type ProcessorFunction = (content: string,
                                contentRange: Range,
                                wholeRange: Range,
                                tokensBuilder: SemanticTokensBuilder,
                                captures: RegExpMatchArray,
                                document: TextDocument,
                                scope: string) => void;

export class Processor {
    public processor: ProcessorFunction;
    public regex = /.+/;

    constructor(processor: ProcessorFunction, regex: RegExp) {
        this.processor = processor;
        this.regex = regex;
    }
}

// ==========================================================================
// Purpose:
// Abstract base class for keyvalue token providers.
// Tokenizes the file and does analysis on it. The inheriting class can define processors to further process keys/values and to set the semantic tokens.
// ==========================================================================

export abstract class KvTokensProviderBase implements DocumentSemanticTokensProvider {
    
    public legend: SemanticTokensLegend;
    public diagnosticCollection: DiagnosticCollection;
    
    tokenizer: Tokenizer;
    diagnostics: Diagnostic[] = [];
    bracketStack = 0;

    protected abstract valueProcessors: Processor[];

    protected abstract keyProcessors: Processor[];

    constructor(legend: SemanticTokensLegend, diagnosticCollection: DiagnosticCollection) {
        this.tokenizer = new Tokenizer();
        this.legend = legend;
        this.diagnosticCollection = diagnosticCollection;
    }

    onDidChangeSemanticTokens?: Event<void> | undefined;
    
    public provideDocumentSemanticTokens(document: TextDocument, cancellationToken: CancellationToken): ProviderResult<SemanticTokens> {
        this.diagnostics = [];
        this.bracketStack = 0;

        const tokensBuilder = new SemanticTokensBuilder(this.legend);

        return this.buildTokens(tokenizeDocument(document), tokensBuilder, document);
    }

    buildTokens(tokens: Token[], tokensBuilder: SemanticTokensBuilder, document: TextDocument): SemanticTokens {
        
        const keys: string[] = [];
        let currentScope = "";

        for(let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const tokenRange = new Range(document.positionAt(token.start), document.positionAt(token.end));

            // No further processing on comments
            if(token.type === TokenType.Comment) {
                tokensBuilder.push(tokenRange, "comment", []);
            }

            if(token.type === TokenType.Key) {
                
                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(tokens, i);
                const nextToken = interestingToken.token;

                // We're an object key
                if(nextToken.type === TokenType.ObjectStart) {
                    tokensBuilder.push(tokenRange, "struct", []);
                    this.bracketStack++;
                    currentScope += `.${stripQuotes(token.value.toLowerCase())}`;
                    continue;
                }
                
                // We're a keyvalue's key. Process the value too and skip forward
                if(nextToken.type === TokenType.Value) {
                    
                    this.processKvKey(token, tokenRange, tokensBuilder, document, currentScope);
                    
                    const nextTokenRange = new Range(document.positionAt(nextToken.start), document.positionAt(nextToken.end));
                    this.processKvValue(nextToken, nextTokenRange, tokensBuilder, document, currentScope);
                    i += interestingToken.offset;
                    
                    // Check for duplicates
                    const scopedKey = `${currentScope}#${token.value}`;
                    
                    if(keys.includes(scopedKey)) {
                        if(this.disallowDuplicate(scopedKey, this.bracketStack, token)) {
                            this.diagnostics.push(new Diagnostic(tokenRange, `Duplicate key '${token.value}'`, DiagnosticSeverity.Warning));
                        }
                    } else {
                        keys.push(scopedKey);
                    }

                    continue;
                }

                // error 
                this.diagnostics.push(new Diagnostic(tokenRange, "Key without value. Please add a value.", DiagnosticSeverity.Error));
            }

            if(token.type === TokenType.ObjectEnd) {
                this.bracketStack--;
                currentScope = currentScope.substring(0, currentScope.lastIndexOf("."));
            }

            if(token.type === TokenType.PreprocessorKey) {

                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(tokens, i);
                const nextToken = interestingToken.token;

                if(nextToken.type === TokenType.Value) {

                    const nextTokenRange = new Range(document.positionAt(nextToken.start), document.positionAt(nextToken.end));

                    tokensBuilder.push(tokenRange, "macro", []);
                    tokensBuilder.push(nextTokenRange, "string", []);

                    continue;
                }

                this.diagnostics.push(new Diagnostic(tokenRange, "Preprocessor key without value. Please add a value.", DiagnosticSeverity.Error));
            }
        }
        
        if(this.bracketStack > 0) {
            this.diagnostics.push(new Diagnostic(document.lineAt(document.lineCount - 1).range, `Object brackets unbalanced. Missing ${this.bracketStack} closing '}'`, DiagnosticSeverity.Error));
        }

        this.diagnosticCollection.clear();
        this.diagnosticCollection.set(document.uri, this.diagnostics);

        return tokensBuilder.build();
    }

    getNextInterestingToken(tokens: Token[], i: number): { token: Token, offset: number } {
        let n = 1;
        let nextToken = tokens[i + n];
        while(nextToken.type === TokenType.Comment) {
            nextToken = tokens[i + n++];
            if(nextToken == null) break;
        }

        return { token: nextToken, offset: n };
    }

    protected processKvKey(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, document: TextDocument, scope: string): void {
        const processed = this.processString(token, range, tokensBuilder, this.keyProcessors, document, scope);
        if(!processed) tokensBuilder.push(range, "variable", ["declaration"]);
    }
    protected processKvValue(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, document: TextDocument, scope: string): void {
        const processed = this.processString(token, range, tokensBuilder, this.valueProcessors, document, scope);
        if(!processed) tokensBuilder.push(range, "string", []);
    }

    processString(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, processors: Processor[], document: TextDocument, scope: string): boolean {
        const unquoted = KvTokensProviderBase.unquoteToken(token, range, tokensBuilder);
        const content = unquoted.content;
        const contentRange = unquoted.range;
        
        const processed = processors.some(processor => {
            const matches = content.match(processor.regex);
            if(matches) {
                processor.processor.call(this, token.value, contentRange, range, tokensBuilder, matches, document, scope);
                return true;
            }
            return false;
        });
        return processed;
    }

    protected disallowDuplicate(scopedKey: string, depth: number, token: Token): boolean {
        return false; // Duplicate keys are allowed by default.
    }

    public static unquoteToken(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder | null): { content: string, range: Range } {
        // Quote tokens
        if( isQuoted(token.value) ) {           
            return {
                content: token.value.substring(1, token.value.length - 1),
                range: new Range(range.start.translate(0, 1), range.end.translate(0, -1))
            };
        } else {
            return {
                content: token.value,
                range: range
            };
        }
    }

}