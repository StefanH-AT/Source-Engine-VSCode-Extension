// ==========================================================================
// Purpose:
// Implementations of language utility providers for the captions language.
// ==========================================================================

import vscode from "vscode";
import KvDocument from "./KvDocument";
import { KvDocumentFormatter } from "./KvFormatter";
import { CaptionsColorsProvider } from "./CaptionsColorsProvider";
import { CaptionsSemanticTokenProvider } from "./CaptionsSemanticTokenProvider";

export const filterCaptionsSaved: vscode.DocumentFilter = {
    language: "captions",
    scheme: "file"
};
export const filterCaptionsUnsaved: vscode.DocumentFilter = {
    language: "captions",
    scheme: "untitled"
};

export const selectorAll: ReadonlyArray<vscode.DocumentFilter> = [filterCaptionsSaved, filterCaptionsUnsaved];

export function init(context: vscode.ExtensionContext): void {
    const captionsColors = vscode.languages.registerColorProvider(selectorAll, new CaptionsColorsProvider());
    const captionsTokenProvider = vscode.languages.registerDocumentSemanticTokensProvider(selectorAll, new CaptionsSemanticTokenProvider(), KvDocument.tokenLegend);
    // TODO: Re-enable formatting here too
    //const captionsFormatter = vscode.languages.registerDocumentFormattingEditProvider(selectorAll, new KvDocumentFormatter());
    context.subscriptions.push(captionsColors, captionsTokenProvider);
}


