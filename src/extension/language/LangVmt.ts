// ==========================================================================
// Purpose:
// Implementations of language utility providers for the vmt language.
// ==========================================================================

import vscode from "vscode";
import KvDocument from "./KvDocument";
import { KvDocumentFormatter } from "./KvFormatter";
import { ShaderParam } from "kv-core/shader-param";
import * as main from "../main";
import { ShaderParamCompletionItemProvider } from "./ShaderParamCompletionItemProvider";
import { ShaderParamHoverProvider } from "./ShaderParamHoverProvider";
import { ShaderParamColorsProvider } from "./ShaderParamColorsProvider";
import { VmtSemanticTokenProvider } from "./VmtSemanticTokenProvider";

export const filterVmtSaved: vscode.DocumentFilter = {
    language: "vmt",
    scheme: "file"
};
export const filterVmtUnsaved: vscode.DocumentFilter = {
    language: "vmt",
    scheme: "untitled"
};
export const selectorAll: ReadonlyArray<vscode.DocumentFilter> = [filterVmtSaved, filterVmtUnsaved];

export let shaderParams: ShaderParam[];
export let internalTextures: string[];

export function init(context: vscode.ExtensionContext): void {
    shaderParams = main.config.get("shaderParameters") ?? [];
    internalTextures = main.config.get("internalTextures") ?? [];

    const vmtSemantics = vscode.languages.registerDocumentSemanticTokensProvider(selectorAll, new VmtSemanticTokenProvider(), KvDocument.tokenLegend);
    const vmtCompletion = vscode.languages.registerCompletionItemProvider(selectorAll, new ShaderParamCompletionItemProvider(), "$", "%");
    const vmtHover = vscode.languages.registerHoverProvider(selectorAll, new ShaderParamHoverProvider());
    const vmtColors = vscode.languages.registerColorProvider(selectorAll, new ShaderParamColorsProvider());
    const vmtFormatter = vscode.languages.registerDocumentFormattingEditProvider(selectorAll, new KvDocumentFormatter());
    context.subscriptions.push(vmtSemantics, vmtCompletion, vmtHover, vmtColors, vmtFormatter);
}

