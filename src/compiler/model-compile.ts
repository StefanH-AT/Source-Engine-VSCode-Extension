// ==========================================================================
// Purpose:
// Adds commands to compile .qc (model) files.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { commands, ExtensionContext, OutputChannel, TextEditor, window } from "vscode";
import { config } from "../main";
import { compileSomething } from "./compiler-base";

let qcChannel: OutputChannel;

export function init(context: ExtensionContext): void {
    const ccCommand = commands.registerTextEditorCommand("mdl.compile", compileModel);
    context.subscriptions.push(ccCommand);
}

async function compileModel(editor: TextEditor): Promise<void> {
    if(qcChannel == null) {
        qcChannel = window.createOutputChannel("Model Compiler");
    }
    const additionalParams: string[] = config.get("modelCompiler.additionalParameters") ?? [];
    await compileSomething(editor, qcChannel, "Model Compiler", "modelCompiler", additionalParams);
}