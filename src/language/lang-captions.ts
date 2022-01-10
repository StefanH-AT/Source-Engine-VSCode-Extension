// ==========================================================================
// Purpose:
// Implementations of language utility providers for the captions language.
// ==========================================================================

import { TextDocument, CancellationToken, DocumentColorProvider, Color, ColorPresentation, Range, ColorInformation, languages, SemanticTokensLegend, SemanticTokensBuilder, ExtensionContext, DocumentSelector } from "vscode";
import { getDocument, KeyvalueDocumentFormatter, KvTokensProviderBase, legend, Processor } from "../keyvalue-document";
import { populateColorTagMatches } from "../kv-core/kv-caption-tag-matches";

export const selector: DocumentSelector = "captions";

export function init(context: ExtensionContext): void {
    const captionsColors = languages.registerColorProvider(selector, new CaptionColorsProvider());
    const captionsTokenProvider = languages.registerDocumentSemanticTokensProvider(selector, new CaptionsSemanticTokenProvider(), legend);
    const captionsFormatter = languages.registerDocumentFormattingEditProvider(selector, new KeyvalueDocumentFormatter());
    context.subscriptions.push(captionsColors, captionsTokenProvider, captionsFormatter);
}

export class CaptionsSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: Processor[] = [
        { regex: /.*/, processor: this.processKey }
    ];
    protected valueProcessors: Processor[] = [
        { regex: /.*/, processor: this.processValue }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection("captions"));
    }

    processKey(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument, scope: string): void {
        tokensBuilder.push(wholeRange, "parameter");
    }

    processValue(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument, scope: string): void {
        
        if(scope === ".lang.tokens") {
            return; // Don't add a semantic token to  lang values and let tmLanguage handle it.
        }
        tokensBuilder.push(wholeRange, "string");
    }

}

export class CaptionColorsProvider implements DocumentColorProvider {
    
    provideDocumentColors(document: TextDocument, cancellationToken: CancellationToken) : ColorInformation[] {
        const lines = document.lineCount;

        const kvDoc = getDocument(document);
        if(kvDoc == null) return [];

        const colorInfos: ColorInformation[] = [];
        
        for(let i = 0; i < lines; i++) {
            if(cancellationToken.isCancellationRequested) break;
            
            // Get a line that isn't empty
            const kv = kvDoc.getKeyValueAt(i);
            if(kv == null) continue;

            const clrInfo = populateColorTagMatches(kv.value);
            clrInfo.forEach((clr) => {
                const colorInfo = new ColorInformation(kv.valueRange.with(kv.valueRange.start.translate(0, clr.start), kv.valueRange.start.translate(0, clr.end)), 
                    new Color(clr.color.r / 255, clr.color.g / 255, clr.color.b / 255, 1.0));
                colorInfos.push(colorInfo);
            });
        }

        return colorInfos;
    }

    provideColorPresentations(color: Color, context: {document: TextDocument, range: Range}, cancellationToken: CancellationToken) : ColorPresentation[] {
        return [];
    }
}