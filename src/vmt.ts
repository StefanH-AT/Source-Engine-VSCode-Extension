
import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList } from 'vscode'

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