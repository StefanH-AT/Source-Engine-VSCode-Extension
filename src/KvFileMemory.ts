import * as vscode from "vscode";
import * as main from "./main";

export function init(context: vscode.ExtensionContext): void {
    const rememberCommand = vscode.commands.registerTextEditorCommand("kv.remember", (e) => _handleOnRemember(context, e));
    const forgetCommand = vscode.commands.registerTextEditorCommand("kv.forget", (e) => _handleOnForget(context, e));
    context.subscriptions.push(rememberCommand, forgetCommand);

    _loadMemoryFromGlobalState(context);
}

export function updateForgetRememberCommandContext(document: vscode.TextDocument): void {
    if(isRemembered(document.uri.fsPath)) {
        vscode.commands.executeCommand('setContext', 'sourceEngine.showKvForget', true);
        vscode.commands.executeCommand('setContext', 'sourceEngine.showKvRemember', false);
    } else {
        vscode.commands.executeCommand('setContext', 'sourceEngine.showKvForget', false);
        vscode.commands.executeCommand('setContext', 'sourceEngine.showKvRemember', true);
    }
}

export function isRemembered(filePath: string): boolean {
    return kvFileMemory.includes(filePath);
}


let kvFileMemory: string[] = [];

function _loadMemoryFromGlobalState(context: vscode.ExtensionContext): void {
    const loadedMemory = context.globalState.get("kv_memory");
    if(loadedMemory === undefined) {
        main.output.appendLine("KeyValue memory is empty");
        return;
    }

    if(!Array.isArray(loadedMemory)) {
        main.output.appendLine("Error: Tried loading KeyValue file memory from global state but it is not an array");
        return;
    }

    kvFileMemory = [];

    let i = 0;
    for(const m of loadedMemory) {
        if(typeof(m) !== "string") {
            main.output.appendLine("Error: Tried loading KeyValue file memory from global state but one of the array entries is not a string");
            continue;
        }

        kvFileMemory.push(m);
        i++;
    }
    
    main.output.appendLine(`Loaded ${i} remembered keyvalue file paths from global store`);
}

function _handleOnRemember(context: vscode.ExtensionContext, editor: vscode.TextEditor): void {
    const filePath = editor.document.uri.fsPath;
    if(isRemembered(filePath)) {
        return;
    }
    kvFileMemory.push(filePath);
    context.globalState.update("kv_memory", kvFileMemory);
    updateForgetRememberCommandContext(editor.document);

    vscode.languages.setTextDocumentLanguage(editor.document, "keyvalue");
}

function _handleOnForget(context: vscode.ExtensionContext, editor: vscode.TextEditor): void {
    const filePath = editor.document.uri.fsPath;
    if(!isRemembered(filePath)) {
        return;
    }
    // Remember that splice deletes in place
    kvFileMemory.splice(kvFileMemory.indexOf(filePath), 1);
    context.globalState.update("kv_memory", kvFileMemory);
    updateForgetRememberCommandContext(editor.document);
    
    vscode.languages.setTextDocumentLanguage(editor.document, "plaintext");
}
