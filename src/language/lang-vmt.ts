// ==========================================================================
// Purpose:
// Implementations of language utility providers for the vmt language.
// ==========================================================================

import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList, Range, SemanticTokensBuilder, SemanticTokensLegend, languages, HoverProvider, Hover, ProviderResult, Diagnostic, DiagnosticSeverity, DocumentColorProvider, Color, ColorInformation, ColorPresentation, CompletionItemKind, SnippetString, MarkdownString, ExtensionContext, DocumentSelector } from "vscode";
import { KeyvalueDocument, getDocument, KeyValue, KeyvalueDocumentFormatter, KvTokensProviderBase, Processor, legend } from "../keyvalue-document";
import { Token } from "../kv-core/kv-tokenizer";
import { ShaderParam } from "../kv-core/shader-param";
import { listFilesSync } from "list-files-in-dir";
import { getParentDocumentDirectory } from "../kv-core/source-fs";
import { config } from "../main";
import { isFloatValue, isScalarValue } from "../kv-core/kv-string-util";


export const selector: DocumentSelector = "vmt";

export let shaderParams: ShaderParam[];
export let internalTextures: string[];

export function init(context: ExtensionContext): void {
    shaderParams = config.get("shaderParameters") ?? [];
    internalTextures = config.get("internalTextures") ?? [];

    const vmtSemantics = languages.registerDocumentSemanticTokensProvider(selector, new VmtSemanticTokenProvider(), legend);
    const vmtCompletion = languages.registerCompletionItemProvider(selector, new ShaderParamCompletionItemProvider(), "$", "%"); // BUG: Trigger characters don't seem to work?
    const vmtHover = languages.registerHoverProvider(selector, new ShaderParamHoverProvider());
    const vmtColors = languages.registerColorProvider(selector, new ShaderParamColorsProvider());
    const vmtFormatter = languages.registerDocumentFormattingEditProvider(selector, new KeyvalueDocumentFormatter());
    context.subscriptions.push(vmtSemantics, vmtCompletion, vmtHover, vmtColors, vmtFormatter);
}

export class VmtSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: Processor[] = [
        { regex: /\$\w+/, processor: this.processKeyShader },
        { regex: /%\w+/, processor: this.processKeyCompile }
    ];

    protected valueProcessors: Processor[] = [
        { regex: /.*/, processor: this.processValue }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection("vmt"));
    }

    processKeyShader(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument): void {
        tokensBuilder.push(wholeRange, "parameter");
    }

    processKeyCompile(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument): void {
        tokensBuilder.push(wholeRange, "parameter", ["readonly"]);
    }

    processValue(content: string, contentRange: Range, wholeRange: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument): void {

        // Get the key value document
        if(!contentRange.isSingleLine) return;
        const kvDoc = getDocument(document);
        if(kvDoc == null) return;

        // Get the key value type at that line
        const kv = kvDoc.getKeyValueAt(contentRange.start.line);
        if(kv == null) return;
        const param = shaderParams.find(p => p.name === kv.key);
        if(param == null) {
            this.processValueString(kv, contentRange, tokensBuilder, kvDoc);
            return;
        }
        if(param.type == null || param.type == "") return;

        // Bit copy paste?
        switch(param.type) {
        case "bool": this.processValueBool(kv, contentRange, tokensBuilder, kvDoc); break;
        case "int": this.processValueInt(kv, contentRange, tokensBuilder, kvDoc); break;
        case "float": this.processValueFloat(kv, contentRange, tokensBuilder, kvDoc); break;
        case "scalar": this.processValueScalar(kv, contentRange, tokensBuilder, kvDoc); break;
        case "texture": this.processValueTexture(kv, contentRange, tokensBuilder, kvDoc); break;
        case "color": this.processValueColor(kv, contentRange, tokensBuilder, kvDoc); break;
        case "env_cubemap": this.processValueCubemap(kv, contentRange, tokensBuilder, kvDoc); break;
            
        case "string": 
        default: this.processValueString(kv, contentRange, tokensBuilder, kvDoc); break;
        }
        
    }

    processValueBool(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        if(kv.value.match(/^[01]$/)) {
            tokensBuilder.push(range, "boolean");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a boolean (0 or 1).", DiagnosticSeverity.Warning));
        }
    }

    processValueInt(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        if(kv.value.match(/^\d+$/)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting an integer.", DiagnosticSeverity.Warning));
        }
    }

    processValueFloat(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        if(isFloatValue(kv.value)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a float.", DiagnosticSeverity.Warning));
        }
    }

    processValueScalar(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        if(isScalarValue(kv.value)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a scalar. (0-1)", DiagnosticSeverity.Warning));
        }
    }

    processValueString(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        tokensBuilder.push(range, "string");
    }

    processValueTexture(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {

        if(internalTextures.includes(kv.value)) {
            tokensBuilder.push(range, "keyword");
            return;
        }

        tokensBuilder.push(range, "string");
    }

    processValueColor(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {

        // Don't put any semantic tokens here. The textmate highlighting is good enough. We only validate the input and provide warning messages
        const colorMatches = getColorMatches(kv.value);
        if(!colorMatches.validFormat) {
            this.diagnostics.push(new Diagnostic(range, "Invalid color value. Format: [0 0.25 1]", DiagnosticSeverity.Warning));
        } else if(colorMatches.outOfBounds) {
            this.diagnostics.push(new Diagnostic(range, "Color values out of bounds. Must be between 0 and 1", DiagnosticSeverity.Warning));
        }
    }

    processValueCubemap(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument): void {
        
        if(kv.value === "env_cubemap") {
            tokensBuilder.push(range, "keyword");
        } else {
            tokensBuilder.push(range, "string");
        }
        
    }

    protected override disallowDuplicate(scopedKey: string, depth: number, token: Token): boolean {
        return depth === 1; // Disallow duplicates on shader parameters
    }
}

export class ShaderParamCompletionItemProvider implements CompletionItemProvider {

    public provideCompletionItems(document: TextDocument, position: Position, cancellationToken: CancellationToken): CompletionList {
        
        const kvDoc = getDocument(document);
        if(kvDoc == null) return new CompletionList();
        const kv = kvDoc.getKeyValueAt(position.line);

        if(kv == null) return new CompletionList();

        // FIXME: Eww!
        if(kv.keyRange.contains(position)) {
            const suggestions = shaderParams.filter(p => p.name.includes(kv.key));
            const completions = suggestions.map(s => {
                const completion = new CompletionItem(s.name);
                completion.insertText = s.name.substring(1);
                if(s.description != null) {
                    completion.documentation = new MarkdownString(s.description);
                }

                if(s.defaultCompletion != null) {
                    completion.insertText += " " + s.defaultCompletion.toString();
                } else if(s.type === "string" || s.type === "texture") {
                    completion.insertText = new SnippetString(completion.insertText + " \"${1}\"");
                }

                if(s.type === "texture") {
                    completion.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions" };
                }

                return completion;
            });
            
            return new CompletionList(completions);
        }


        if(kv.valueRange.contains(position) && kv.value === "") {
            const param = shaderParams.find(p => p.name == kv.key);

            const completions = new CompletionList();

            if(param == null) return new CompletionList();

            // Completion contributors below here

            this.completeDefault(completions, document, kv, param);
            this.completeTexturePath(completions, document, kv, param);
            

            return completions;

        }

        return new CompletionList();
        
    }

    completeDefault(completions: CompletionList, document: TextDocument, kv: KeyValue, param: ShaderParam): void {
        if(param.defaultCompletion == null) return;
        const completion = new CompletionItem(param.defaultCompletion.toString());
        completion.detail = "Default Completion";
        completion.kind = CompletionItemKind.Value;
        completions.items.push( completion );
    }

    completeTexturePath(completions: CompletionList, document: TextDocument, kv: KeyValue, param: ShaderParam): void {
        if(param.type !== "texture" && document.uri.scheme !== "file") return;

        internalTextures.forEach(rt => {
            const completion = new CompletionItem(rt);
            completion.detail = "Internal engine texture";
            completion.kind = CompletionItemKind.Keyword;
            completions.items.push(completion);
        });

        const materialRoot = getParentDocumentDirectory(document.uri.path, "material");

        if(materialRoot != null) {
            
            const textureFiles = listFilesSync(materialRoot, "vtf");
            textureFiles.forEach( t => {
                const filePath = t.substring(materialRoot.length + 1);
                const filePathWithoutExtension = filePath.substring(0, filePath.length - 4);

                const completion = new CompletionItem(filePath);
                completion.insertText = filePathWithoutExtension;
                completion.detail = "Texture Path";
                completion.kind = CompletionItemKind.File;
                completion.preselect = true;
                completions.items.push(completion);
            });
        }
    }
}

export class ShaderParamHoverProvider implements HoverProvider {

    provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover | null {

        const kvDoc = getDocument(document);
        if(kvDoc == null) return null;
        const kv = kvDoc.getKeyValueAt(position.line);

        if(kv == null) return null;
        
        const param = shaderParams.find(p => p.name == kv.key);
        if(param == null) return null;
        const name = param.name;
        const defaultCompletion = param.defaultCompletion;
        const description = param.description;
        const uri = param.wikiUri;

        if(kv.keyRange.contains(position) && kv.key !== "") {
            let hoverText = `(Shader Parameter) **${name}** [${param.type}] ${defaultCompletion != null ? ("- Default: " + defaultCompletion) : ""}`;
            if(description != null) hoverText += `\n\n${description}`;
            if(uri != null) hoverText += `\n\n[Wiki](${uri})`;

            return new Hover(hoverText, kv.keyRange);
        }

        if(kv.valueRange.contains(position) && kv.value !== "") {
            if(param.type === "env_cubemap" && kv.value === "env_cubemap") {
                return new Hover("Internal Texture, Samples the environment cubemap.");
            }
        }


        return null;
    }

}

export class ShaderParamColorsProvider implements DocumentColorProvider {

    provideDocumentColors(document: TextDocument, token: CancellationToken): ColorInformation[] | null {
        const kvDoc = getDocument(document);
        if(kvDoc == null) return null;

        const colorInfos: ColorInformation[] = [];
        
        // TODO: This seems like it should be reusable.
        const valueTokens = kvDoc.getAllValueTokens();
        valueTokens.forEach(t => {
            const line = document.positionAt(t.start).line;
            const kv = kvDoc.getKeyValueAt(line);
            if(kv == null) return;
            
            const param = shaderParams.find(p => p.name === kv.key);
            if(param == null) return;

            if(param.type !== "color") return;
            
            const colorMatches = getColorMatches(kv.value);
            if(!colorMatches.validFormat || colorMatches.outOfBounds || colorMatches.color == null) return;

            const colorInfo = new ColorInformation(kv.valueRange, colorMatches.color);
            colorInfos.push(colorInfo);
        });

        return colorInfos;
    }

    provideColorPresentations(color: Color, context: { document: TextDocument; range: Range; }, token: CancellationToken): ProviderResult<ColorPresentation[]> {
        return [];
    }

}

function getColorMatches(colorString: string): { validFormat: boolean, outOfBounds: boolean, color: Color | null, matches: RegExpMatchArray | null }  {
    const matches = colorString.match(/\[(0?\.\d+|1|0) (0?\.\d+|1|0) (0?\.\d+|1|0)\]/);
    if(!matches) return {
        validFormat: false,
        outOfBounds: false,
        color: null,
        matches: null
    };

    const r = parseFloat(matches[1]);
    const g = parseFloat(matches[2]);
    const b = parseFloat(matches[3]);

    if(r > 1 || r < 0 || g > 1 || g < 0 || b > 1 || b < 0) return {
        validFormat: true,
        outOfBounds: true,
        color: null,
        matches: matches
    };

    return {
        validFormat: true,
        outOfBounds: false,
        color: new Color(r, g, b, 1),
        matches: matches
    };
}