import path from "path";
import * as vscode from "vscode";
import * as main from "./main";

type DetectableLanguageId = "keyvalue" | "soundscript" | "captions";

interface CommonFileName {
    regex: RegExp;
    languageId: DetectableLanguageId;
}

const commonKvFileNames: CommonFileName[] = [
    { regex: /gameinfo\.txt/i, languageId: "keyvalue" },
    { regex: /subtitles_.+\.txt/i, languageId: "captions" },
    { regex: /captions_.+\.txt/i, languageId: "captions" },
    { regex: /basemodui_.+\.txt/i, languageId: "keyvalue" },
    { regex: /instructor_lessons\.txt/i, languageId: "keyvalue" },
    { regex: /instructor_textures\.txt/i, languageId: "keyvalue" },
    { regex: /game_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /npc_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /level_sounds_.+\.txt/i, languageId: "soundscript" },
    { regex: /soundscapes_.+\.txt/i, languageId: "soundscript" },
    { regex: /surfaceproperties_.+\.txt/i, languageId: "keyvalue" },
    { regex: /weapon_.+\.txt/i, languageId: "keyvalue" },
    { regex: /vgui_screens\.txt/i, languageId: "keyvalue" },
    { regex: /credits\.txt/i, languageId: "keyvalue" },
    { regex: /soundmixers\.txt/i, languageId: "keyvalue" },
];

function getCommonFileNameMatch(fileName: string): CommonFileName | undefined {
    return commonKvFileNames.find((c) => c.regex.test(fileName));
}

export function init(context: vscode.ExtensionContext): void {
    const onChange = vscode.workspace.onDidOpenTextDocument(onChangeEditor);
    context.subscriptions.push(onChange);

    // Detect all currently open documents (When the extension is loaded, there might already be opened documents)
    vscode.workspace.textDocuments.forEach(detectKeyvalueFile);
}

function onChangeEditor(document: vscode.TextDocument): void {
    main.debugOutput.appendLine(`Active editor changed to ${document.uri.fsPath}`);

    detectKeyvalueFile(document);
}

function detectKeyvalueFile(document: vscode.TextDocument): void {

    const enabled = main.config.get("detectKeyvalueFiles.enabled");
    if(!enabled) {
        return;
    }

    main.debugOutput.appendLine("File has language id: " + document.languageId);
    if(document.languageId !== "plaintext") return;

    main.debugOutput.appendLine(`Potential kv file opened (${document.uri.fsPath})`);

    const langId = getPotentialKvFileLanguageId(document);
    if(langId === undefined) {
        main.debugOutput.appendLine(`Not changing document language of (${document.uri.fsPath})`);
        return;
    }

    main.debugOutput.appendLine(`Changing document language of (${document.uri.fsPath}) to keyvalue`);
    vscode.languages.setTextDocumentLanguage(document, langId);
}

function getPotentialKvFileLanguageId(document: vscode.TextDocument): DetectableLanguageId | undefined {
    const documentFileName = path.basename(document.uri.fsPath);

    main.debugOutput.appendLine(`Checking if filename (${documentFileName}) is in list of common kv file names.`);
    const match = getCommonFileNameMatch(documentFileName);
    if(match == undefined) {
        return undefined;
    }
    
    main.debugOutput.appendLine(`! File (${document.uri.fsPath}) has a common file name and is associated with LanguageId: ${match.languageId}`);
    return match.languageId;
}
