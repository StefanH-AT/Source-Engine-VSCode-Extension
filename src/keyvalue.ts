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

    protected keyProcessors: { processor: Function; regex: RegExp; }[] = [];
    protected valueProcessors: { processor: Function; regex: RegExp; }[] =
    [
        { regex: /^\d+(\.\d+)?$/, processor: this.processValueNumber },
        { regex: /^(\{|\[)((\d+(\.\d+)? ?)+)(\}|\])$/, processor: this.processValueArray }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection('keyvalue3'));
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