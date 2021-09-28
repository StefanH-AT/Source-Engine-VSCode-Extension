import { commands, ExtensionContext, OutputChannel, ProgressLocation, TextEditor, window, workspace } from "vscode";
import { config } from "./main";
import * as fs from 'fs';
import { isWhitespace } from "./keyvalue-parser/kv-string-util";
import { spawn } from "child_process";

let ccChannel: OutputChannel;

export function init(context: ExtensionContext) {
    const ccCommand = commands.registerTextEditorCommand("captions.compile", compileCaptions);
    context.subscriptions.push(ccCommand);
}

function compileCaptions(editor: TextEditor) {

    if(ccChannel == null) {
        ccChannel = window.createOutputChannel("Captions Compiler");
    }

    const ccExePath = config.get<string>("");
    const ccFilePath = editor.document.uri.path;

    if( ccExePath == null || isWhitespace(ccExePath) ) {
        window.showErrorMessage("Captions compiler path is empty. Please configure!");
        return;
    }

    if( !fs.existsSync(ccExePath) ) {
        window.showErrorMessage(`Captions compiler exe at '${ccExePath}' does not exist.`);
        return;
    }

    const ccProcess = spawn(ccExePath, [ ccFilePath ]);

    
    ccChannel.appendLine(`Compiling captions for ${ccFilePath}`);
    ccChannel.clear();
    ccChannel.show();

    ccProcess.stdout.on('data', data => {
        ccChannel.appendLine("> " + data);
    });
    
    ccProcess.stderr.on('data', data => {
        ccChannel.appendLine("! " + data);
    })

    ccProcess.stdout.on('close', (exitCode: Number) => {
        if(exitCode === 0) {
            ccChannel.appendLine("Completed successfully!");
        } else {
            ccChannel.appendLine("Compilation failed with error code " + exitCode);
        }
    });

    window.withProgress({
        location: ProgressLocation.Notification,
        title: "Compiling caption",
        cancellable: true
    }, (progress, token) => {

        const promise = new Promise<void>(resolve => {
            // Put loading bar code here. I'm coding this on linux and captioncompile is a windows program :(
        });

        return promise;
    });
}