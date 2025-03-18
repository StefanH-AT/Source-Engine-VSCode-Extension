// Entry point to the extension. Keep code here to a minimum.

import * as vscode from "vscode";
import * as vmt from "./language/LangVmt";
import * as captions from "./language/LangCaptions";
import * as keyvalue from "./language/LangKv";
import * as captionsCompile from "./compiler/captions-compile";
import * as modelCompile from "./compiler/model-compile";
import * as performance from "./performance";
import * as kvDetect from "./KvFileDetection";
import * as kvFileMemory from "./KvFileMemory";

import * as packageJson from "../package.json";

export let output: vscode.OutputChannel;
export let debugOutput: vscode.OutputChannel;
export let config: vscode.WorkspaceConfiguration;

export function deactivate(): void {}
export function activate(context: vscode.ExtensionContext): void {
    
    output = vscode.window.createOutputChannel("Source Engine Support");
    debugOutput = vscode.window.createOutputChannel("Source Engine Support Debug");
    context.subscriptions.push(output, debugOutput);
    
    updateConfig();
    const configChangeEvent = vscode.workspace.onDidChangeConfiguration(updateConfig);
    context.subscriptions.push(configChangeEvent);

    // Memory must come before detect so the state is loaded
    kvFileMemory.init(context);
    kvDetect.init(context);
    
    keyvalue.init(context);
    vmt.init(context);
    captions.init(context);
    
    captionsCompile.init(context);
    modelCompile.init(context);
    
    output.appendLine(`Started Source Engine Support v${packageJson.version}`);

    performance.init(context);
}


const updateConfig = () => config = vscode.workspace.getConfiguration("sourceEngine");
