import * as vscode from 'vscode'
import * as vmt from './lang-vmt'
import * as captions from './lang-captions'
import * as keyvalue from './lang-keyvalue'
import { ShaderParam } from './shader-param'


const packageJson = require('../package.json');

export let output: vscode.OutputChannel;
let config: vscode.WorkspaceConfiguration;

// TODO: Refactor the config system and how language systems are initialized
let shaderParams: ShaderParam[];
let internalTextures: string[];

export function activate(context: vscode.ExtensionContext) {

    output = vscode.window.createOutputChannel("Source Engine Support");
    context.subscriptions.push(output);

    loadConfig();
    const loadConfigEvent = vscode.workspace.onDidChangeConfiguration(loadConfig)
    context.subscriptions.push(loadConfigEvent);

    const kvSelector = { language: 'keyvalue3', scheme: 'file' };
    const kvTokenProvider = new keyvalue.KeyvalueSemanticTokensProvider();
    const kvSemantics = vscode.languages.registerDocumentSemanticTokensProvider(kvSelector, kvTokenProvider, kvTokenProvider.legend);
    context.subscriptions.push(kvSemantics);
    context.subscriptions.push(kvTokenProvider.diagnosticCollection);

    vmt.initShaderParams(shaderParams, internalTextures);
    const vmtSelector = { language: 'vmt', schema: 'file' };
    const vmtTokenProvider = new vmt.VmtSemanticTokenProvider();
    const vmtSemantics = vscode.languages.registerDocumentSemanticTokensProvider(vmtSelector, vmtTokenProvider, vmtTokenProvider.legend);
    const vmtCompletion = vscode.languages.registerCompletionItemProvider("vmt", new vmt.ShaderParamCompletionItemProvider(), "$", "%");
    const vmtHover = vscode.languages.registerHoverProvider("vmt", new vmt.ShaderParamHoverProvider());
    const vmtColors = vscode.languages.registerColorProvider("vmt", new vmt.ShaderParamColorsProvider());
    context.subscriptions.push(vmtSemantics);
    context.subscriptions.push(vmtCompletion);
    context.subscriptions.push(vmtHover);
    context.subscriptions.push(vmtColors);

    const captionsColors = vscode.languages.registerColorProvider("captions", new captions.CaptionColorsProvider())
    context.subscriptions.push(captionsColors);

    output.appendLine(`Started Source Engine Support v${packageJson.version}`);
}

function loadConfig() {
    config = vscode.workspace.getConfiguration("source-engine");
    shaderParams = config.get("shaderParameters") ?? [];
    internalTextures = config.get("internalTextures") ?? [];
}

export function deactivate() {}

