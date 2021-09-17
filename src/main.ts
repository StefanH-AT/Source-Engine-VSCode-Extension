import * as vscode from 'vscode'
import * as vmt from './lang-vmt'
import * as captions from './lang-captions'
import * as keyvalue from './lang-keyvalue'


const packageJson = require('../package.json');

export let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {

    output = vscode.window.createOutputChannel("Source Engine Support");
    context.subscriptions.push(output);

    config = vscode.workspace.getConfiguration("sourceEngine");

    keyvalue.init(context);
    vmt.init(context);
    captions.init(context);

    output.appendLine(`Started Source Engine Support v${packageJson.version}`);
}

export let config: vscode.WorkspaceConfiguration; 

export function deactivate() {}
