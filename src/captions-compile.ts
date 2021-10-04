import { commands, ExtensionContext, FileType, OutputChannel, ProgressLocation, TextEditor, Uri, window, workspace } from "vscode";
import { config } from "./main";
import * as fs from "fs";
import { isWhitespace } from "./kv-core/kv-string-util";
import { execFile } from "child_process";

let ccChannel: OutputChannel;

export function init(context: ExtensionContext): void {
    const ccCommand = commands.registerTextEditorCommand("captions.compile", compileCaptions);
    context.subscriptions.push(ccCommand);
}

async function compileCaptions(editor: TextEditor) {

    if(ccChannel == null) {
        ccChannel = window.createOutputChannel("Captions Compiler");
    }

    const ccExePath: string = config.get("captionCompiler.executablePath") ?? "";
    const ccOpenOutput: boolean = config.get("captionCompiler.openOutputWindow") ?? false;

    const ccFileUri = editor.document.uri;
    const ccFileStat = await workspace.fs.stat(ccFileUri);
    if(ccFileStat.type !== FileType.File) return; // TODO: Display an error message?
    const ccFilePath = ccFileUri.fsPath;

    if( ccExePath == null || isWhitespace(ccExePath) ) {
        window.showErrorMessage("Captions compiler path is empty. Please configure!");
        return;
    }

    if( !fs.existsSync(ccExePath) ) {
        window.showErrorMessage(`Captions compiler exe at '${ccExePath}' does not exist.`);
        return;
    }

    // Prepare output -------------

    ccChannel.clear();
    ccChannel.appendLine(`Compiling captions for ${ccFilePath}`);
    
    if(ccOpenOutput) {
        ccChannel.show();
    }

    // Start process ----------------

    const workDir = Uri.joinPath(ccFileUri, "..").fsPath;
    const ccProcess = execFile(ccExePath, [ ccFilePath ], {
        cwd: workDir
    }, (error, stdout, stderr) => {
        if(error) {
            ccChannel.appendLine("ERROR: " + error.message);
        }
        if(stdout) ccChannel.appendLine("> " + stdout);
        if(stderr) ccChannel.appendLine("! " + stderr);
    });

    window.withProgress({
        location: ProgressLocation.Notification,
        title: "Compiling caption",
        cancellable: true
    }, (progress, token) => {

        token.onCancellationRequested(e => {
            ccProcess.kill();
            ccChannel.appendLine("Cancelled compilation process");
        });

        progress.report({ message: "Compiling", increment: 0});
        
        const promise = new Promise<void>(resolve => {

            ccProcess.on("exit", (exitCode: number) => {
                if(exitCode === 0) {
                    ccChannel.appendLine("Completed successfully!");
                } else {
                    ccChannel.appendLine("Compilation failed with error code " + exitCode);
                }
                progress.report({ message: "Compiling", increment: 100});
                resolve();
            });

        });

        return promise;
    });
}