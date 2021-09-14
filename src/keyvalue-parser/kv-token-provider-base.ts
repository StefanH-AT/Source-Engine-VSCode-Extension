import { CancellationToken, Diagnostic, DiagnosticCollection, DiagnosticSeverity, DocumentSemanticTokensProvider, Event, ProviderResult, Range, SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend, TextDocument } from "vscode";
import { addDocument } from "../keyvalue-document";
import { Token, Tokenizer, TokenType } from "./kv-tokenizer";

export abstract class KvTokensProviderBase implements DocumentSemanticTokensProvider {
    
    public legend: SemanticTokensLegend;
    public diagnosticCollection: DiagnosticCollection;
    
    tokenizer: Tokenizer;
    diagnostics: Diagnostic[] = [];
    bracketStack: number = 0;

    protected abstract valueProcessors: {
        processor: Function,
        regex: RegExp
    }[];

    protected abstract keyProcessors: {
        processor: Function,
        regex: RegExp
    }[];

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

        addDocument(document, tokens);

        const tokensBuilder = new SemanticTokensBuilder(this.legend);

        return this.buildTokens(tokens, tokensBuilder, document);
    }

    buildTokens(tokens: Token[], tokensBuilder: SemanticTokensBuilder, document: TextDocument) : SemanticTokens {
        
        const keys: string[] = [];
        let currentScope: string = "";

        for(let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const tokenRange = new Range(document.positionAt(token.start), document.positionAt(token.end));

            // No further processing on comments
            if(token.type === TokenType.Comment) {
                tokensBuilder.push(tokenRange, 'comment', []);
            }

            if(token.type === TokenType.Key) {
                
                // Get next token that isn't a comment 
                const interestingToken = this.getNextInterestingToken(tokens, i);
                const nextToken = interestingToken.token;

                // We're an object key
                if(nextToken.type === TokenType.ObjectStart) {
                    tokensBuilder.push(tokenRange, 'struct', []);
                    this.bracketStack++;
                    currentScope += `.${token.value}`;
                    continue;
                }
                
                // We're a keyvalue's key. Process the value too and skip forward
                if(nextToken.type === TokenType.Value) {
                    
                    this.processKvKey(token, tokenRange, tokensBuilder, document);
                    
                    const nextTokenRange = new Range(document.positionAt(nextToken.start), document.positionAt(nextToken.end));
                    this.processKvValue(nextToken, nextTokenRange, tokensBuilder, document);
                    i += interestingToken.offset;
                    
                    // Check for duplicates
                    const scopedKey = `${currentScope}#${token.value}`;
                    
                    if(keys.includes(scopedKey)) {
                        this.diagnostics.push(new Diagnostic(tokenRange, `Duplicate key '${token.value}'`, DiagnosticSeverity.Warning));
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

    protected processKvKey(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, document: TextDocument): void {
        const processed = this.processString(token, range.with(range.start, range.end.translate(0, 1)), tokensBuilder, this.keyProcessors, document);
        if(!processed) tokensBuilder.push(range, 'variable', ['declaration']);
    }
    protected processKvValue(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, document: TextDocument): void {
        const processed = this.processString(token, range, tokensBuilder, this.valueProcessors, document);
        if(!processed) tokensBuilder.push(range, 'string', []);
    }

    processString(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder, processors: { processor: Function, regex: RegExp }[], document: TextDocument): boolean {
        const unquoted = KvTokensProviderBase.unquoteToken(token, range, tokensBuilder);
        const content = unquoted.content;
        const contentRange = unquoted.range;
        
        const processed = processors.some(processor => {
            const matches = content.match(processor.regex);
            if(matches) {
                processor.processor.call(this, content, contentRange, tokensBuilder, matches, document);
                return true;
            }
            return false;
        });
        return processed;
    }

    public static unquoteToken(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder | null): { content: string, range: Range } {
        // Quote tokens
        if( (token.value.startsWith('"') && token.value.startsWith('"')) || 
            (token.value.startsWith("'") && token.value.startsWith("'"))) {
            
            if(tokensBuilder != null) {
                tokensBuilder.push(new Range(range.start, range.start.translate(0, 1)), 'string', []);
                tokensBuilder.push(new Range(range.end.translate(0, -1), range.end), 'string', []);
            }
            
            return {
                content: token.value.substring(1, token.value.length - 1),
                range: new Range(range.start.translate(0, 1), range.end.translate(0, -1))
            }
        } else {
            return {
                content: token.value,
                range: range
            }
        }
    }

}