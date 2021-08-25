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

    const captionsColors = vscode.languages.registerColorProvider("captions", new CaptionColorsProvider())
    context.subscriptions.push(captionsColors);
}

function loadConfig() {
    config = vscode.workspace.getConfiguration("source-engine");
    shaderParams = config.get("shaderParameters");
}

function deactivate() {}

class ShaderParamCompletionItemProvider {
    provideCompletionItems(document, position, cancellationToken) {

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

class CaptionColorsProvider {
    constructor() {
        this.head = "<clr:";
        this.tail = ">";
    }
    provideDocumentColors(document, cancellationToken) {
        const lines = document.lineCount;

        const colorInfos = [];
        // TODO: Implement <playerclr>
        for(let i = 0; i < lines; i++) {
            if(cancellationToken.isCancellationRequested) break;
            
            // Get a line that isn't empty
            const line = document.lineAt(i);
            if(line.isEmptyOrWhitespace) continue;
            const lineText = line.text;

            // Check if it start with the color tag
            const beginIndex = lineText.indexOf(this.head);
            if(beginIndex === -1) continue;
            
            // Check if it ends with the color tag
            const rest = lineText.slice(beginIndex);
            const endIndex = rest.indexOf(this.tail);
            if(endIndex === -1) continue;

            // Extract the values of the color tag
            const colorString = rest.substring(this.head.length, endIndex);
            let rgb = colorString.split(",");
            if(rgb.length != 3) continue;
            
            // Validate array
            rgb = rgb.map(item => parseInt(item));
            if(rgb.some(item => {
                const num = parseInt(item);
                return num == null || num < 0 || num > 255;
            })) continue;

            // Get the position and color information
            const posStart = beginIndex + this.head.length;
            const posEnd = endIndex + beginIndex;
            //output.appendLine(`${posStart}-${posEnd} => '${lineText.substring(posStart, posEnd)}'`);

            // We got a color!
            const color = new vscode.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, 1.0);
            const range = new vscode.Range(i, posStart, i, posEnd);
            const colorInfo = new vscode.ColorInformation(range, color);
            colorInfos.push(colorInfo);
        }

        return colorInfos;
    }

    provideColorPresentations(color, context, cancellationToken) {

    }
}

module.exports = {
    activate,
    deactivate
}