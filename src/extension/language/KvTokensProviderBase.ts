import * as vscode from "vscode";
import { KvPiece } from "../Kv";
import { isQuoted, stripQuotes } from "../../kv-core/kv-string-util";
import { Token, TokenType } from "../../kv-core/kv-tokenizer";
import KvDocument from "./KvDocument";
import { KvSemanticProcessor, KvSemanticProcessorParams } from "./KvSemanticProcessor";

// ==========================================================================
// Purpose:
// Abstract base class for keyvalue token providers.
// Tokenizes the file and does analysis on it. The inheriting class can define processors to further process keys/values and to set the semantic tokens.
// ==========================================================================

export abstract class KvTokensProviderBase implements vscode.DocumentSemanticTokensProvider {

    public legend: vscode.SemanticTokensLegend;
    public diagnosticCollection: vscode.DiagnosticCollection;

    diagnostics: vscode.Diagnostic[] = [];
    bracketStack = 0;

    protected tokens: Token[];

    protected abstract valueProcessors: KvSemanticProcessor[];

    protected abstract keyProcessors: KvSemanticProcessor[];

    constructor(legend: vscode.SemanticTokensLegend, diagnosticCollection: vscode.DiagnosticCollection) {
        this.tokens = [];
        this.legend = legend;
        this.diagnosticCollection = diagnosticCollection;
    }

    onDidChangeSemanticTokens?: vscode.Event<void> | undefined;

    public provideDocumentSemanticTokens(document: vscode.TextDocument, cancellationToken: vscode.CancellationToken): vscode.ProviderResult<vscode.SemanticTokens> {
        this.diagnostics = [];
        this.bracketStack = 0;

        const tokensBuilder = new vscode.SemanticTokensBuilder(this.legend);
        const kvDoc = KvDocument.from(document);
        return this.buildTokens(kvDoc, tokensBuilder);
    }

    buildTokens(kvDoc: KvDocument, tokensBuilder: vscode.SemanticTokensBuilder): vscode.SemanticTokens {

        const keys: string[] = [];
        let currentScope = "";

        for (let i = 0; i < kvDoc.tokens.length; i++) {
            const token = kvDoc.tokens[i];
            const tokenRange = new vscode.Range(kvDoc.document.positionAt(token.start), kvDoc.document.positionAt(token.end));

            // No further processing on comments
            if (token.type === TokenType.Comment) {
                tokensBuilder.push(tokenRange, "comment", []);
                continue;
            }

            if (token.type === TokenType.Key) {

                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(kvDoc.tokens, i);
                
                // We're an object key
                if (interestingToken?.token.type === TokenType.ObjectStart) {
                    tokensBuilder.push(tokenRange, "struct", []);
                    this.bracketStack++;
                    currentScope += "." + stripQuotes(token.value.toLowerCase());
                    continue;
                }

                this.processKvKey(token, tokenRange, tokensBuilder, kvDoc, currentScope);
                
                // Is this key not followed by a value?
                if (interestingToken?.token.type !== TokenType.Value) {
                    this.diagnostics.push(new vscode.Diagnostic(tokenRange, "Expecting value to this key", vscode.DiagnosticSeverity.Error));
                }
                continue;
            }

            // We're a keyvalue's key. Process the value too and skip forward
            if (token.type === TokenType.Value) {

                this.processKvValue(token, tokenRange, tokensBuilder, kvDoc, currentScope);
                
                continue;
            }            

            if (token.type === TokenType.ObjectEnd) {
                this.bracketStack--;
                currentScope = currentScope.substring(0, currentScope.lastIndexOf("."));
                continue;
            }

            if (token.type === TokenType.PreprocessorKey) {

                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(kvDoc.tokens, i);
                if (interestingToken?.token.type === TokenType.Value) {
                    
                    const nextToken = interestingToken.token;
                    const nextTokenRange = new vscode.Range(kvDoc.document.positionAt(nextToken.start), kvDoc.document.positionAt(nextToken.end));

                    tokensBuilder.push(tokenRange, "macro", []);
                    tokensBuilder.push(nextTokenRange, "string", []);

                    continue;
                }

                this.diagnostics.push(new vscode.Diagnostic(tokenRange, "Expecting value to this preprocessor statement", vscode.DiagnosticSeverity.Error));
                continue;
            }

            if(token.type === TokenType.Conditional) {
                tokensBuilder.push(tokenRange, "keyword", []);
            }
        }

        if (this.bracketStack > 0) {
            this.diagnostics.push(new vscode.Diagnostic(kvDoc.document.lineAt(kvDoc.document.lineCount - 1).range, `Object brackets unbalanced. Missing ${this.bracketStack} closing '}'`, vscode.DiagnosticSeverity.Error));
        }

        this.diagnosticCollection.clear();
        this.diagnosticCollection.set(kvDoc.document.uri, this.diagnostics);

        return tokensBuilder.build();
    }

    getNextInterestingToken(tokens: Token[], i: number): { token: Token; offset: number; } | null {
        let n = 1;
        if(tokens.length - 1 < i + n) {
            return null;
        }
        let nextToken = tokens[i + n];
        while (nextToken.type === TokenType.Comment) {
            nextToken = tokens[i + n++];
            if (nextToken == null)
                break;
        }

        return { token: nextToken, offset: n };
    }

    protected processKvKey(token: Token, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDocument: KvDocument, scope: string): void {
        const processed = this.processString(token, range, tokensBuilder, this.keyProcessors, kvDocument, scope);
        if (!processed)
            tokensBuilder.push(range, "variable", ["declaration"]);
    }
    protected processKvValue(token: Token, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDocument: KvDocument, scope: string): void {
        const processed = this.processString(token, range, tokensBuilder, this.valueProcessors, kvDocument, scope);
        if (!processed)
            tokensBuilder.push(range, "string", []);
    }

    processString(token: Token, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, processors: KvSemanticProcessor[], kvDocument: KvDocument, scope: string): boolean {
        const unquoted = KvTokensProviderBase.unquoteToken(token, range);

        const processed = processors.some(processor => {
            const matches = unquoted.content.match(processor.regex);
            if (matches) {
                const params: KvSemanticProcessorParams = {
                    kvPiece: unquoted,
                    captures: matches,
                    kvDocument: kvDocument,
                    scope: scope,
                    tokensBuilder: tokensBuilder,
                    wholeRange: range
                };
                return processor.processor.call<KvTokensProviderBase, [KvSemanticProcessorParams], boolean>(this, params);
            }
            return false;
        });
        return processed;
    }

    protected disallowDuplicate(scopedKey: string, depth: number, token: Token): boolean {
        return false; // Duplicate keys are allowed by default.
    }

    public static unquoteToken(token: Token, range: vscode.Range): KvPiece {
        // Quote tokens
        let unquotedContent: string = token.value;
        let unquotedRange: vscode.Range = range;
        if (isQuoted(token.value)) {
            unquotedContent = token.value.substring(1, token.value.length - 1);
            unquotedRange = new vscode.Range(range.start.translate(0, 1), range.end.translate(0, -1));
        }
        return new KvPiece(unquotedContent, unquotedRange);
    }

}
