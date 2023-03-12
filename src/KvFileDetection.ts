import path from "path";
import * as vscode from "vscode";
import * as main from "./main";
import * as shared from "./language/Shared";

function isAutoDetectEnabled(): boolean {
    return main.config.get<boolean>("kvAutoDetect.enabled", false);
}

function isAutoDetectEnabledOnlyInWorkspaces(): boolean {
    return main.config.get<boolean>("kvAutoDetect.onlyInSourceEngineWorkspaces", true);
}

function getSourceEngineWorkspaces(): string[] {
    return main.config.get<string[]>("sourceEngineWorkspaces", []);
}


type DetectableLanguageId = "keyvalue3" | "soundscript" | "captions";
interface CommonFileName {
    regex: RegExp;
    languageId: DetectableLanguageId;
}

const commonKvFileNames: CommonFileName[] = [
    { regex: /gameinfo\.txt/i, languageId: "keyvalue3" },
    { regex: /subtitles_.+\.txt/i, languageId: "captions" },
    { regex: /captions_.+\.txt/i, languageId: "captions" },
    { regex: /basemodui_.+\.txt/i, languageId: "keyvalue3" },
    { regex: /instructor_lessons\.txt/i, languageId: "keyvalue3" },
    { regex: /instructor_textures\.txt/i, languageId: "keyvalue3" },
    { regex: /game_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /npc_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /level_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /soundscapes_.+\.txt/i, languageId: "soundscript" },
    { regex: /surfaceproperties_.+\.txt/i, languageId: "keyvalue3" },
    { regex: /weapon_.+\.txt/i, languageId: "keyvalue3" },
    { regex: /vgui_screens\.txt/i, languageId: "keyvalue3" },
    { regex: /credits\.txt/i, languageId: "keyvalue3" }
];

function getCommonFileNameMatch(fileName: string): CommonFileName | undefined {
    return commonKvFileNames.find((c) => c.regex.test(fileName));
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

        const langId = getPotentialKvFileLanguageId(editor.document);
        if(langId === undefined) {
            main.debugOutput.appendLine(`Not changing document language of (${editor.document.uri.fsPath})`);
            return;
        }

        main.debugOutput.appendLine(`Changing document language of (${editor.document.uri.fsPath}) to keyvalue3`);
        vscode.languages.setTextDocumentLanguage(editor.document, langId);
    }
}

function getPotentialKvFileLanguageId(document: vscode.TextDocument): DetectableLanguageId | undefined {
    if(isAutoDetectEnabledOnlyInWorkspaces()) {

        if(!isDocumentInSourceEngineWorkspace(document)) {
            main.debugOutput.appendLine(`Auto detect is enabled only in source engine workspaces, but the document (${document.uri.fsPath}) is not in a source engine workspace.`);
            return undefined;
        }

    }

    const documentFileName = path.basename(document.uri.fsPath);

    main.debugOutput.appendLine(`Auto detect is enabled. Checking if filename (${documentFileName}) is in list of common kv file names.`);
    const match = getCommonFileNameMatch(documentFileName);
    if(match == undefined) {
        return undefined;
    }
    
    main.debugOutput.appendLine(`! File (${document.uri.fsPath}) has a common file name and is associated with LanguageId: ${match.languageId}`);
    return match.languageId;
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

