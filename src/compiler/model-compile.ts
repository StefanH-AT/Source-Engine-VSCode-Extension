// ==========================================================================
// Purpose:
// Adds commands to compile .qc (model) files.
// ==========================================================================

import vscode from "vscode";
import { compileSomething } from "./compiler-base";

let qcChannel: vscode.OutputChannel;

export function init(context: vscode.ExtensionContext): void {
    const ccCommand = vscode.commands.registerTextEditorCommand("mdl.compile", compileModel);
    context.subscriptions.push(ccCommand);
}

async function compileModel(editor: vscode.TextEditor): Promise<void> {
    if(qcChannel == null) {
        qcChannel = vscode.window.createOutputChannel("Model Compiler");
    }
    
    await compileSomething({
        channel: qcChannel,
        editor: editor,
        compilerName: "Model Compiler",
        configPrefix: "modelCompiler"
    });
}