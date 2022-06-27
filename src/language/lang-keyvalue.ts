// ==========================================================================
// Purpose:
// Implementations of language utility providers for the keyvalues language.
//
// This is NOT a base for other formats!
// ==========================================================================

import { Range, SemanticTokensBuilder, SemanticTokensLegend, languages, TextDocument, ExtensionContext, DocumentSelector, DocumentFilter } from "vscode";
import { KeyvalueDocument, KeyvalueDocumentFormatter, KvTokensProviderBase, legend, Processor } from "../keyvalue-document";

export const filterKvSaved: DocumentFilter = {
    language: "keyvalue3",
    scheme: "file"
};
export const filterKvUnsaved: DocumentFilter = {
    language: "keyvalue3",
    scheme: "untitled"
};
export const filterSoundscriptSaved: DocumentFilter = {
    language: "soundscript",
    scheme: "file"
};
export const filterSoundscriptUnsaved: DocumentFilter = {
    language: "soundscript",
    scheme: "untitled"
};
export const selectorAll: ReadonlyArray<DocumentFilter> = [ filterKvSaved, filterKvUnsaved, filterSoundscriptSaved, filterSoundscriptUnsaved ];

export function init(context: ExtensionContext): void {
    const kvTokenProvider = new KeyvalueSemanticTokensProvider();
    const kvSemantics = languages.registerDocumentSemanticTokensProvider(selectorAll, kvTokenProvider, kvTokenProvider.legend);
    const kvFormatter = languages.registerDocumentFormattingEditProvider(selectorAll, new KeyvalueDocumentFormatter());
    context.subscriptions.push(kvSemantics, kvTokenProvider.diagnosticCollection, kvFormatter);
}

export class KeyvalueSemanticTokensProvider extends KvTokensProviderBase {

    protected keyProcessors: Processor[] = [];
    protected valueProcessors: Processor[] =
    [
        { regex: /^\d+(\.\d+)?$/, processor: this.processValueNumber },
        { regex: /^(\{|\[)((\d+(\.\d+)? ?)+)(\}|\])$/, processor: this.processValueArray }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection("keyvalue3"));
    }
    
    processValueNumber(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, kvDocument: KeyvalueDocument): void {
        tokensBuilder.push(wholeRange, "number", []);
    }

    processValueArray(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, kvDocument: KeyvalueDocument): void {
        // [] {}
        tokensBuilder.push(new Range(contentRange.start, contentRange.start.translate(0, 1)), "operator", []);
        tokensBuilder.push(new Range(contentRange.end.translate(0, -1), contentRange.end), "operator", []);

        tokensBuilder.push(new Range(contentRange.start.translate(0, 1), contentRange.end.translate(0, -1)), "number", []);
    }

}
