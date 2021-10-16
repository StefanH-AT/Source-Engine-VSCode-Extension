// ==========================================================================
// Purpose:
// Implementations of language utility providers for the keyvalues language.
//
// This is NOT a base for other formats!
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { Range, SemanticTokensBuilder, SemanticTokensLegend, languages, TextDocument, ExtensionContext, DocumentSelector } from "vscode";
import { KeyvalueDocumentFormatter, KvTokensProviderBase, legend, Processor } from "../keyvalue-document";

export const selector: DocumentSelector = "keyvalue3";

export function init(context: ExtensionContext): void {
    const kvTokenProvider = new KeyvalueSemanticTokensProvider();
    const kvSemantics = languages.registerDocumentSemanticTokensProvider(selector, kvTokenProvider, kvTokenProvider.legend);
    const kvFormatter = languages.registerDocumentFormattingEditProvider(selector, new KeyvalueDocumentFormatter());
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
    
    processValueNumber(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument): void {
        tokensBuilder.push(wholeRange, "number", []);
    }

    processValueArray(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument): void {
        // [] {}
        tokensBuilder.push(new Range(contentRange.start, contentRange.start.translate(0, 1)), "operator", []);
        tokensBuilder.push(new Range(contentRange.end.translate(0, -1), contentRange.end), "operator", []);

        tokensBuilder.push(new Range(contentRange.start.translate(0, 1), contentRange.end.translate(0, -1)), "number", []);
    }

}
