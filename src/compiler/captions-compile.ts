// ==========================================================================
// Purpose:
// Adds commands to compile caption files.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { commands, ExtensionContext, OutputChannel, TextEditor, window } from "vscode";
import { compileSomething } from "./compiler-base";

let ccChannel: OutputChannel;

export function init(context: ExtensionContext): void {
    const ccCommand = commands.registerTextEditorCommand("captions.compile", compileCaptions);
    context.subscriptions.push(ccCommand);
}

async function compileCaptions(editor: TextEditor): Promise<void> {
    if(ccChannel == null) {
        ccChannel = window.createOutputChannel("Captions Compiler");
    }
    await compileSomething(editor, ccChannel, "Captions Compiler", "captionCompiler");
}