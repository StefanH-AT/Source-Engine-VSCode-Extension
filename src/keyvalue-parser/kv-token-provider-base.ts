import { CancellationToken, Diagnostic, DiagnosticCollection, DiagnosticSeverity, DocumentSemanticTokensProvider, Event, ProviderResult, Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument } from "vscode";
import { Token, Tokenizer, TokenType } from "./kv-tokenizer";

export abstract class KvTokensProviderBase implements DocumentSemanticTokensProvider {
    
    public legend: SemanticTokensLegend;
    public diagnosticCollection: DiagnosticCollection;
    
    tokenizer: Tokenizer;
    diagnostics: Diagnostic[] = [];
    bracketStack: number = 0;

    constructor(legend: SemanticTokensLegend, diagnosticCollection: DiagnosticCollection) {
        this.tokenizer = new Tokenizer();
        this.legend = legend;
        this.diagnosticCollection = diagnosticCollection;
    }

    onDidChangeSemanticTokens?: Event<void> | undefined;
    
    public provideDocumentSemanticTokens(document: TextDocument, cancellationToken: CancellationToken): ProviderResult<SemanticTokens> {
        this.diagnostics = [];
        this.bracketStack = 0;

        const text = document.getText();
        this.tokenizer.tokenizeFile(text);
        const tokens = this.tokenizer.tokens;

        const tokensBuilder = new SemanticTokensBuilder(this.legend);

        return this.buildTokens(tokens, tokensBuilder, document);
    }

    buildTokens(tokens: Token[], tokensBuilder: SemanticTokensBuilder, document: TextDocument) : SemanticTokens {
        
        for(let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const tokenRange = new Range(document.positionAt(token.start), document.positionAt(token.end));

            // No further processing on comments
            if(token.type === TokenType.Comment) {
                tokensBuilder.push(tokenRange, 'comment', []);
            }

            if(token.type === TokenType.String) {
                
                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(tokens, i);
                const nextToken = interestingToken.token;

                // We're an object key
                if(nextToken.type === TokenType.ObjectStart) {
                    tokensBuilder.push(tokenRange, 'struct', []);
                    this.bracketStack++;
                    continue;
                }
                
                // We're a keyvalue's key. Process the value too and skip forward
                if(nextToken.type === TokenType.String) {
                    
                    this.processKvKey(token, tokenRange, tokensBuilder);
                    
                    const nextTokenRange = new Range(document.positionAt(nextToken.start), document.positionAt(nextToken.end));
                    this.processKvValue(nextToken, nextTokenRange, tokensBuilder);
                    i += interestingToken.offset;
                    continue;
                }

                // error 
                this.diagnostics.push(new Diagnostic(tokenRange, "Key without valve. Please add a value.", DiagnosticSeverity.Error))
            }

            if(token.type === TokenType.ObjectEnd) {
                this.bracketStack--;
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
            if(nextToken == null) break; // TODO: Do some analysis here. This seems very illegal
        }

        return { token: nextToken, offset: n };
    }

    protected abstract processKvKey(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder): void;
    protected abstract processKvValue(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder): void;

}