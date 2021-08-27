import * as vscode from 'vscode'
import * as vmt from './vmt'
import * as captions from './captions'
import * as keyvalue from './keyvalue'
const packageJson = require('../package.json');

let output: vscode.OutputChannel;
let config: vscode.WorkspaceConfiguration;
let shaderParams: string[] | undefined;

export function activate(context: vscode.ExtensionContext) {

    output = vscode.window.createOutputChannel("Source Engine Support");
    context.subscriptions.push(output);

    loadConfig();
    const loadConfigEvent = vscode.workspace.onDidChangeConfiguration(loadConfig)
    context.subscriptions.push(loadConfigEvent);

    const selector = { language: 'keyvalue3', scheme: 'file' };
    const keyvalueTokenProvider = new keyvalue.KeyvalueSemanticTokensProvider();
    const keyvaluesSemantics = vscode.languages.registerDocumentSemanticTokensProvider(selector, keyvalueTokenProvider, keyvalueTokenProvider.legend);
    context.subscriptions.push(keyvaluesSemantics);
    context.subscriptions.push(keyvalueTokenProvider.diagnosticCollection);

    const vmtCompletion = vscode.languages.registerCompletionItemProvider("vmt", new vmt.ShaderParamCompletionItemProvider(shaderParams), "$", "%");
    context.subscriptions.push(vmtCompletion);

    const captionsColors = vscode.languages.registerColorProvider("captions", new captions.CaptionColorsProvider())
    context.subscriptions.push(captionsColors);

    output.appendLine(`Started Source Engine Support v${packageJson.version}`);
}

function loadConfig() {
    config = vscode.workspace.getConfiguration("source-engine");
    shaderParams = config.get("shaderParameters");
}

export function deactivate() {}

