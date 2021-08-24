const vscode = require('vscode');

let output;
let config;
let shaderParams;

function activate(context) {

    output = vscode.window.createOutputChannel("Source Engine Support");
    context.subscriptions.push(output);

    loadConfig();
    const loadConfigEvent = vscode.workspace.onDidChangeConfiguration(loadConfig)
    context.subscriptions.push(loadConfigEvent);

    const vmtCompletion = vscode.languages.registerCompletionItemProvider("vmt", new ShaderParamCompletionItemProvider(), "$", "%");
    context.subscriptions.push(vmtCompletion);
    
}

function loadConfig() {
    config = vscode.workspace.getConfiguration("source-engine");
    shaderParams = config.get("shaderParameters");
}

function deactivate() {}

class ShaderParamCompletionItemProvider {
    provideCompletionItems(document, position, token) {

        const lineText = document.lineAt(position.line).text;

        const start = Math.max(lineText.indexOf("$"), lineText.indexOf("%")) + 1;
        const paramName = lineText.substring(start, position.character);
        
        const suggestions = Object.keys(shaderParams).filter(p => p.includes(paramName));
        const completions = suggestions.map(s => {
            const completion = new vscode.CompletionItem(s);
            completion.insertText = s.substring(1);
            return completion;
        });

        return new vscode.CompletionList(completions)
    }
}

module.exports = {
    activate,
    deactivate
}