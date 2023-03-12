import path from "path";
import * as vscode from "vscode";
import * as main from "./main";

function isAutoDetectEnabled(): boolean {
    return main.config.get<boolean>("kvAutoDetect.enabled", false);
}

function isAutoDetectEnabledOnlyInWorkspaces(): boolean {
    return main.config.get<boolean>("kvAutoDetect.onlyInSourceEngineWorkspaces", true);
}

function getSourceEngineWorkspaces(): string[] {
    return main.config.get<string[]>("sourceEngineWorkspaces", []);
}

const globalStateAutoDetectRecommended = "kvAutoDetect.recommended";
function recommendAutoDetection(context: vscode.ExtensionContext): void {

    const alreadyRecommended = context.globalState.get(globalStateAutoDetectRecommended, false);
    if(alreadyRecommended) return;

    vscode.window.showInformationMessage("Source Engine keyvalue files can be auto detected. Do you want to enable this feature?", "Yes", "No")
        .then((value: string | undefined) => {
            if(value === "Yes") {
                main.config.update("kvAutoDetect.enabled", true, true);
            }

            context.globalState.update(globalStateAutoDetectRecommended, true);
        });
}

export function init(context: vscode.ExtensionContext): void {
    const onChange = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined): void => {
        main.debugOutput.appendLine(`Active editor changed to ${editor?.document.uri.fsPath}`);
        if(editor === undefined) return;
        detectKeyvalueFile(editor, context);
    });
    context.subscriptions.push(onChange);
}

function detectKeyvalueFile(editor: vscode.TextEditor, context: vscode.ExtensionContext): void {

    if(!isAutoDetectEnabled()) {
        main.debugOutput.appendLine("Auto detect is disabled. Not detecting kv file.");

        recommendAutoDetection(context);
        return;
    }

    main.debugOutput.appendLine("File has language id: " + editor.document.languageId);
    if(editor.document.languageId === "plaintext") {
        main.debugOutput.appendLine(`Potential kv file opened (${editor.document.uri.fsPath})`);

        if(isPotentialKvFile(editor.document)) {
            main.debugOutput.appendLine(`Changing document language of (${editor.document.uri.fsPath}) to keyvalue3`);
            vscode.languages.setTextDocumentLanguage(editor.document, "keyvalue3");
        } else {
            main.debugOutput.appendLine(`Not changing document language of (${editor.document.uri.fsPath})`);
        }

    }
}

function isPotentialKvFile(document: vscode.TextDocument): boolean {
    if(isAutoDetectEnabledOnlyInWorkspaces()) {

        if(!isDocumentInSourceEngineWorkspace(document)) {
            main.debugOutput.appendLine(`Auto detect is enabled only in source engine workspaces, but the document (${document.uri.fsPath}) is not in a source engine workspace.`);
            return false;
        }

    }

    const documentFileName = path.basename(document.uri.fsPath);

    main.debugOutput.appendLine(`Auto detect is enabled. Checking if filename (${documentFileName}) is in list of common kv file names.`);
    if(isFileNameCommonKvFile(documentFileName)) {
        main.debugOutput.appendLine(`! File (${document.uri.fsPath}) is a potential kv file.`);
        return true;
    }

    return false;
}

function isDocumentInSourceEngineWorkspace(document: vscode.TextDocument): boolean {
    let fileUri: string = document.uri.fsPath;
    let sourceEngineWorkspaces: string[] = getSourceEngineWorkspaces();

    // Make paths lower case on windows
    if(process.platform === "win32") {
        fileUri = fileUri.toLowerCase();
        sourceEngineWorkspaces = sourceEngineWorkspaces.map((workspace) => workspace.toLowerCase());
    }

    main.debugOutput.appendLine(`Checking if file (${fileUri}) is in any source engine workspace.`);

    for(const workspace of sourceEngineWorkspaces) {
        main.debugOutput.appendLine(`- Checking if file (${fileUri}) is in workspace (${workspace})`);
        if(fileUri.startsWith(workspace)) {
            main.debugOutput.appendLine(`! File (${fileUri}) is in workspace (${workspace})`);
            return true;
        }
    }

    main.debugOutput.appendLine(`! File (${fileUri}) is not in any source engine workspace.`);

    return false;
}

const commonKvFileNames: RegExp[] = [
    /gameinfo\.txt/i,
    /subtitles_.+\.txt/i,
    /captions_.+\.txt/i,
    /basemodui_.+\.txt/i,
    /game_sounds_.+\.txt/i,
    /instructor_lessons\.txt/i,
    /instructor_textures\.txt/i,
    /npc_sounds_.+\.txt/i,
    /level_sounds_.+\.txt/i,
    /soundscapes_.+\.txt/i,
    /surfaceproperties_.+\.txt/i,
    /weapon_.+\.txt/i,
    /vgui_screens\.txt/i,
    /credits\.txt/i
];

function isFileNameCommonKvFile(fileName: string): boolean {
    return commonKvFileNames.some((regex) => regex.test(fileName));
}