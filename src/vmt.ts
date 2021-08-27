import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList, Range, SemanticTokensBuilder, SemanticTokensLegend, languages } from 'vscode'
import { KvTokensProviderBase } from './keyvalue-parser/kv-token-provider-base';

export const legend = new SemanticTokensLegend([
    'struct',
    'comment',
    'variable',
    'string',
    'number',
    'operator',
    'keyword'
], [
    'declaration',
    'readonly'
]);

export class VmtSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: { processor: Function; regex: RegExp; }[] = [
        { regex: /\$\w+/, processor: this.processKeyShader },
        { regex: /\%\w+/, processor: this.processKeyCompile }
    ];

    protected valueProcessors: { processor: Function; regex: RegExp; }[] = [
        
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection('vmt'));
    }

    processKeyShader(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        tokensBuilder.push(range, 'keyword');
    }

    processKeyCompile(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        tokensBuilder.push(range, 'keyword', ['readonly']);
    }

}

export class ShaderParamCompletionItemProvider implements CompletionItemProvider {
    shaderParams: string[];
    constructor(shaderParams: string[] | undefined) {
        if(shaderParams == null) {
            this.shaderParams = [];
        } else {
            this.shaderParams = shaderParams;
        }
    }
    public provideCompletionItems(document: TextDocument, position: Position, cancellationToken: CancellationToken): CompletionList {
        
        const lineText = document.lineAt(position.line).text;
        
        const start = Math.max(lineText.indexOf("$"), lineText.indexOf("%")) + 1;
        const paramName = lineText.substring(start, position.character);
        
        const suggestions = Object.keys(this.shaderParams).filter(p => p.includes(paramName));
        const completions = suggestions.map(s => {
            const completion = new CompletionItem(s);
            completion.insertText = s.substring(1);
            return completion;
        });
        
        return new CompletionList(completions);
    }
}