import { FileType, OutputChannel, ProgressLocation, TextEditor, Uri, window, workspace } from "vscode";
import { isWhitespace } from "../kv-core/kv-string-util";
import { config } from "../main";
import * as fs from "fs";
import { execFile } from "child_process";

export interface CompileSettings {
    editor: TextEditor;
    channel: OutputChannel | undefined;
    compilerName: string;
    configPrefix: string;
}

export async function compileSomething(settings: CompileSettings): Promise<void> {

    const channel = settings.channel ?? window.createOutputChannel(settings.compilerName);

    const exePath: string = config.get(`${settings.configPrefix}.executablePath`) ?? "";
    const shouldOpenOutputWindow: boolean = config.get(`${settings.configPrefix}.openOutputWindow`) ?? false;
    const params: string[] = config.get(`${settings.configPrefix}.additionalParameters`) ?? [];
    
    const fileUri = settings.editor.document.uri;
    const fileStat = await workspace.fs.stat(fileUri);
    if(fileStat.type !== FileType.File) {
        window.showErrorMessage("The current document is not a file. Cannot compile. Honestly, I have no idea how this is possible, so if you can into this, please message me.");
        return;
    }
    const filePath = fileUri.fsPath;
    const workDir: string = config.get(`${settings.configPrefix}.workingDirectory`) ?? Uri.joinPath(fileUri, "..").fsPath;

    if( exePath == null || isWhitespace(exePath) ) {
        window.showErrorMessage(`${settings.compilerName} path is empty. Please configure!`);
        return;
    }

    if( !fs.existsSync(exePath) ) {
        window.showErrorMessage(`${settings.compilerName} executeable at '${exePath}' does not exist.`);
        return;
    }

    // Prepare output -------------

    channel.clear();
    channel.appendLine(`Running ${settings.compilerName} for ${filePath}`);
    
    if(shouldOpenOutputWindow) {
        channel.show();
    }

    // Start process ----------------
    params.push(filePath);
    const process = execFile(exePath, params, {
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
        title: settings.compilerName,
        cancellable: true
    }, (progress, token) => {

        token.onCancellationRequested(e => {
            process.kill();
            channel.appendLine("Cancelled compilation process");
        });

        progress.report({ message: "Compiling", increment: 0});
        
        const promise = new Promise<void>(resolve => {

            process.on("exit", (exitCode: number) => {
                if(exitCode === 0) {
                    channel.appendLine("Completed successfully!");
                } else {
                    channel.appendLine("Compilation failed with error code " + exitCode);
                    channel.show(); // Always open the output when the compilation failed
                }
                progress.report({ message: "Compiling", increment: 100});
                resolve();
            });

        });

        return promise;
    });

}