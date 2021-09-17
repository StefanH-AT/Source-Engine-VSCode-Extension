
import { TextDocument, CancellationToken, DocumentColorProvider, Color, ColorPresentation, Range, ColorInformation, languages, SemanticTokensLegend, SemanticTokensBuilder, ExtensionContext, DocumentSelector } from "vscode";
import { getDocument, KeyvalueDocumentFormatter } from "./keyvalue-document";
import { KvTokensProviderBase, Processor } from "./keyvalue-parser/kv-token-provider-base";

export const legend = new SemanticTokensLegend([
    'struct',
    'comment',
    'variable',
    'string',
    'number',
    'boolean',
    'operator',
    'keyword',
    'parameter'
], [
    'declaration',
    'readonly'
]);

export const selector: DocumentSelector = "captions";

export function init(context: ExtensionContext) {
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
        super(legend, languages.createDiagnosticCollection('captions'));
    }

    processKey(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument, scope: string) {
        tokensBuilder.push(range, "parameter");
    }

    processValue(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument, scope: string) {
        
        if(scope === ".lang.tokens") {
            return; // Don't add a semantic token to  lang values and let tmLanguage handle it.
        }
        tokensBuilder.push(range, "string");
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

            const clrMatches = [...kv.value.matchAll(/<clr:(\d{1,3}),(\d{1,3}),(\d{1,3})>/g)];
            clrMatches.forEach(match => {
                const color = new Color(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255, 1.0);

                const wholeString = match[0];
                const posStart = kv.value.indexOf(wholeString);
                const posEnd = posStart + wholeString.length;
                const range = kv.valueRange.with(kv.valueRange.start.translate(0, posStart + 5), kv.valueRange.start.translate(0, posEnd - 1));
                colorInfos.push(new ColorInformation(range, color));
            });

            const playerclrMatches = [...kv.value.matchAll(/<playerclr:(\d{1,3}),(\d{1,3}),(\d{1,3}):(\d{1,3}),(\d{1,3}),(\d{1,3})>/g)];
            playerclrMatches.forEach(match => {
                const color1 = new Color(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255, 1.0);
                const color2 = new Color(parseInt(match[4]) / 255, parseInt(match[5]) / 255, parseInt(match[6]) / 255, 1.0);

                const wholeString = match[0];
                const posStart = kv.value.indexOf(wholeString);

                const start1 = kv.value.indexOf(":") + 1;
                const end1 = kv.value.lastIndexOf(":") + 1;
                const end2 = kv.value.lastIndexOf(">");

                const range1 = kv.valueRange.with(kv.valueRange.start.translate(0, start1), kv.valueRange.start.translate(0, end1));
                const range2 = kv.valueRange.with(kv.valueRange.start.translate(0, end1), kv.valueRange.start.translate(0, end2));
                colorInfos.push(new ColorInformation(range1, color1), new ColorInformation(range2, color2));
            });

        }

        return colorInfos;
    }

    provideColorPresentations(color: Color, context: {document: TextDocument, range: Range}, cancellationToken: CancellationToken) : ColorPresentation[] {
        return [];
    }
}