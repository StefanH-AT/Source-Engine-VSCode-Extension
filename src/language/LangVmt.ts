// ==========================================================================
// Purpose:
// Implementations of language utility providers for the vmt language.
// ==========================================================================

import * as shared from "./Shared";
import vscode from "vscode";
import KvDocument from "./KvDocument";
//import { KvDocumentFormatter } from "./KvFormatter";
import { ShaderParamCompletionItemProvider } from "./ShaderParamCompletionItemProvider";
import { ShaderParamHoverProvider } from "./ShaderParamHoverProvider";
import { ShaderParamColorsProvider } from "./ShaderParamColorsProvider";
import { VmtSemanticTokenProvider } from "./VmtSemanticTokenProvider";


export const selectorAll: ReadonlyArray<vscode.DocumentFilter> = [shared.filterVmtSaved, shared.filterVmtUnsaved];

export function init(context: vscode.ExtensionContext): void {

    const vmtSemantics = vscode.languages.registerDocumentSemanticTokensProvider(selectorAll, new VmtSemanticTokenProvider(), KvDocument.tokenLegend);
    const vmtCompletion = vscode.languages.registerCompletionItemProvider(selectorAll, new ShaderParamCompletionItemProvider(), "$", "%");
    const vmtHover = vscode.languages.registerHoverProvider(selectorAll, new ShaderParamHoverProvider());
    const vmtColors = vscode.languages.registerColorProvider(selectorAll, new ShaderParamColorsProvider());
    // TODO: Re-enable formatting here too
    //const vmtFormatter = vscode.languages.registerDocumentFormattingEditProvider(selectorAll, new KvDocumentFormatter());
    context.subscriptions.push(vmtSemantics, vmtCompletion, vmtHover, vmtColors);
}

