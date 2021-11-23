import { FileType, OutputChannel, ProgressLocation, TextEditor, Uri, window, workspace } from "vscode";
import { isWhitespace } from "../kv-core/kv-string-util";
import { config } from "../main";
import * as fs from "fs";
import { execFile } from "child_process";

export async function compileSomething(editor: TextEditor, channel: OutputChannel, compilerName: string, configPrefix: string, commandParams: string[] = []): Promise<void> {

    if(channel == null) {
        channel = window.createOutputChannel(compilerName);
    }

    const ccExePath: string = config.get(`${configPrefix}.executablePath`) ?? "";
    const ccOpenOutput: boolean = config.get(`${configPrefix}.openOutputWindow`) ?? false;

    const ccFileUri = editor.document.uri;
    const ccFileStat = await workspace.fs.stat(ccFileUri);
    if(ccFileStat.type !== FileType.File) return; // TODO: Display an error message?
    const ccFilePath = ccFileUri.fsPath;

    if( ccExePath == null || isWhitespace(ccExePath) ) {
        window.showErrorMessage(`${compilerName} path is empty. Please configure!`);
        return;
    }

    if( !fs.existsSync(ccExePath) ) {
        window.showErrorMessage(`${compilerName} executeable at '${ccExePath}' does not exist.`);
        return;
    }

    // Prepare output -------------

    channel.clear();
    channel.appendLine(`Running ${compilerName} for ${ccFilePath}`);
    
    if(ccOpenOutput) {
        channel.show();
    }

    // Start process ----------------
    commandParams.push(ccFilePath);
    const workDir = Uri.joinPath(ccFileUri, "..").fsPath;
    const ccProcess = execFile(ccExePath, commandParams, {
        cwd: workDir
    }, (error, stdout, stderr) => {
        if(error) {
            channel.appendLine("ERROR: " + error.message);
        }
        if(stdout) channel.appendLine("> " + stdout);
        if(stderr) channel.appendLine("! " + stderr);
    });

    window.withProgress({
        location: ProgressLocation.Notification,
        title: compilerName,
        cancellable: true
    }, (progress, token) => {

        token.onCancellationRequested(e => {
            ccProcess.kill();
            channel.appendLine("Cancelled compilation process");
        });

        progress.report({ message: "Compiling", increment: 0});
        
        const promise = new Promise<void>(resolve => {

            ccProcess.on("exit", (exitCode: number) => {
                if(exitCode === 0) {
                    channel.appendLine("Completed successfully!");
                } else {
                    channel.appendLine("Compilation failed with error code " + exitCode);
                }
                progress.report({ message: "Compiling", increment: 100});
                resolve();
            });

        });

        return promise;
    });

}