import { Token } from './keyvalue-parser/kv-tokenizer'
import { Range, SemanticTokensBuilder, SemanticTokensLegend, languages } from 'vscode';
import { KvTokensProviderBase } from './keyvalue-parser/kv-token-provider-base';

export const legend = new SemanticTokensLegend([
    'struct',
    'comment',
    'variable',
    'string',
    'number',
    'operator'
], [
    'declaration'
]);

export class KeyvalueSemanticTokensProvider extends KvTokensProviderBase {

    valueProcessors: {
        processor: Function,
        regex: RegExp
    }[] = [
        { processor: this.processValueNumber, regex: /^\d+(\.\d+)?$/},
        { processor: this.processValueArray, regex: /^(\{|\[)((\d+(\.\d+)? ?)+)(\}|\])$/}
    ]
    constructor() {
        super(legend, languages.createDiagnosticCollection('keyvalue3'));
    }

    protected processKvKey(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder): void {
        tokensBuilder.push(range, 'variable', ['declaration']);
    }
    protected processKvValue(token: Token, range: Range, tokensBuilder: SemanticTokensBuilder): void {
        
        let content = token.value;
        let contentRange = range;

        // Quote tokens
        if( (token.value.startsWith('"') && token.value.startsWith('"')) || 
            (token.value.startsWith("'") && token.value.startsWith("'"))) {

            tokensBuilder.push(new Range(range.start, range.start.translate(0, 1)), 'string', []);
            tokensBuilder.push(new Range(range.end.translate(0, -1), range.end), 'string', []);

            content = content.substring(1, content.length - 1);
            contentRange = new Range(range.start.translate(0, 1), range.end.translate(0, -1));
        }
        const processed = this.valueProcessors.some(processor => {
            const matches = content.match(processor.regex);
            if(matches) {
                processor.processor.call(this, content, contentRange, tokensBuilder, matches);
                return true;
            }
            return false;
        });

        // Nothing special, we're a string.
        if(!processed) tokensBuilder.push(range, 'string', []);
    }
    
    processValueNumber(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        tokensBuilder.push(range, 'number', []);
    }

    processValueArray(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        // [] {}
        tokensBuilder.push(new Range(range.start, range.start.translate(0, 1)), 'operator', []);
        tokensBuilder.push(new Range(range.end.translate(0, -1), range.end), 'operator', []);

        tokensBuilder.push(new Range(range.start.translate(0, 1), range.end.translate(0, -1)), 'number', [])
    }

}