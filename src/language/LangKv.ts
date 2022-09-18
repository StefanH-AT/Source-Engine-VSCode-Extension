// ==========================================================================
// Purpose:
// Implementations of language utility providers for the keyvalues language.
//
// This is NOT a base for other formats!
// ==========================================================================

import * as vscode from "vscode";
import { KvTokensProviderBase } from "./KvTokensProviderBase";
import { KvDocumentFormatter } from "./KvFormatter";
import { KvSemanticProcessor, KvSemanticProcessorParams } from "./KvSemanticProcessor";
import KvDocument from "./KvDocument";
import { matrixRegExp } from "@sourcelib/vmt";

export const filterKvSaved: vscode.DocumentFilter = {
    language: "keyvalue3",
    scheme: "file"
};
export const filterKvUnsaved: vscode.DocumentFilter = {
    language: "keyvalue3",
    scheme: "untitled"
};
export const filterSoundscriptSaved: vscode.DocumentFilter = {
    language: "soundscript",
    scheme: "file"
};
export const filterSoundscriptUnsaved: vscode.DocumentFilter = {
    language: "soundscript",
    scheme: "untitled"
};
export const selectorAll: ReadonlyArray<vscode.DocumentFilter> = [ filterKvSaved, filterKvUnsaved, filterSoundscriptSaved, filterSoundscriptUnsaved ];

export function init(context: vscode.ExtensionContext): void {
    const kvTokenProvider = new KeyvalueSemanticTokensProvider();
    const kvSemantics = vscode.languages.registerDocumentSemanticTokensProvider(selectorAll, kvTokenProvider, kvTokenProvider.legend);
    const kvFormatter = vscode.languages.registerDocumentFormattingEditProvider(selectorAll, new KvDocumentFormatter());
    context.subscriptions.push(kvSemantics, kvTokenProvider.diagnosticCollection, kvFormatter);
}

export class KeyvalueSemanticTokensProvider extends KvTokensProviderBase {

    protected keyProcessors: KvSemanticProcessor[] = [];
    protected valueProcessors: KvSemanticProcessor[] =
    [
        { regex: /^\d+(\.\d+)?$/, processor: this.processValueNumber },
        { regex: matrixRegExp, processor: this.processValueArray }
    ];

    constructor() {
        super(KvDocument.tokenLegend, vscode.languages.createDiagnosticCollection("keyvalue3"));
    }
    
    processValueNumber(params: KvSemanticProcessorParams): boolean {
        params.tokensBuilder.push(params.kvPiece.range, "number", []);
        return true;
    }

    processValueArray(params: KvSemanticProcessorParams): boolean {
        // [] {}
        params.tokensBuilder.push(new vscode.Range(params.kvPiece.range.start, params.kvPiece.range.start.translate(0, 1)), "operator", []);
        params.tokensBuilder.push(new vscode.Range(params.kvPiece.range.end.translate(0, -1), params.kvPiece.range.end), "operator", []);

        params.tokensBuilder.push(new vscode.Range(params.kvPiece.range.start.translate(0, 1), params.kvPiece.range.end.translate(0, -1)), "number", []);
        return true;
    }

}
