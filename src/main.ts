// ==========================================================================
// Purpose:
// Entry point to the extension. Keep code here to a minimum.
// ==========================================================================


import * as vscode from "vscode";
import * as vmt from "./language/lang-vmt";
import * as captions from "./language/lang-captions";
import * as keyvalue from "./language/lang-keyvalue";
import * as captionsCompile from "./compiler/captions-compile";
import * as modelCompile from "./compiler/model-compile";


import * as packageJson from "../package.json";

export let output: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {

    output = vscode.window.createOutputChannel("Source Engine Support");
    context.subscriptions.push(output);

    config = vscode.workspace.getConfiguration("sourceEngine");

    keyvalue.init(context);
    vmt.init(context);
    captions.init(context);
    
    captionsCompile.init(context);
    modelCompile.init(context);

    output.appendLine(`Started Source Engine Support v${packageJson.version}`);
}

export let config: vscode.WorkspaceConfiguration; 

export function deactivate(): void {}
