// ==========================================================================
// Purpose:
// Implementations of language utility providers for the vmt language.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList, Range, SemanticTokensBuilder, SemanticTokensLegend, languages, HoverProvider, Hover, ProviderResult, Diagnostic, DiagnosticSeverity, DocumentColorProvider, Color, ColorInformation, ColorPresentation, CompletionItemKind, SnippetString, MarkdownString, ExtensionContext, DocumentSelector } from 'vscode'
import { KeyvalueDocument, getDocument, KeyValue, tokenizeDocument, KeyvalueDocumentFormatter } from './keyvalue-document';
import { KvTokensProviderBase, Processor } from './kv-core/kv-token-provider-base';
import { Token, Tokenizer } from './kv-core/kv-tokenizer';
import { ShaderParam } from './shader-param';
import { listFilesSync } from 'list-files-in-dir'
import { getParentDocumentDirectory } from './source-fs';
import { config } from './main';

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

export const selector: DocumentSelector = "vmt";

export let shaderParams: ShaderParam[];
export let internalTextures: string[];

export function init(context: ExtensionContext) {
    shaderParams = config.get("shaderParameters") ?? [];
    internalTextures = config.get("internalTextures") ?? [];

    const vmtSemantics = languages.registerDocumentSemanticTokensProvider(selector, new VmtSemanticTokenProvider(), legend);
    const vmtCompletion = languages.registerCompletionItemProvider(selector, new ShaderParamCompletionItemProvider(), '$', '%'); // BUG: Trigger characters don't seem to work?
    const vmtHover = languages.registerHoverProvider(selector, new ShaderParamHoverProvider());
    const vmtColors = languages.registerColorProvider(selector, new ShaderParamColorsProvider());
    const vmtFormatter = languages.registerDocumentFormattingEditProvider(selector, new KeyvalueDocumentFormatter());
    context.subscriptions.push(vmtSemantics, vmtCompletion, vmtHover, vmtColors, vmtFormatter);
}

export class VmtSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: Processor[] = [
        { regex: /\$\w+/, processor: this.processKeyShader },
        { regex: /\%\w+/, processor: this.processKeyCompile }
    ];

    protected valueProcessors: Processor[] = [
        { regex: /.*/, processor: this.processValue }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection('vmt'));
    }

    processKeyShader(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument) {
        tokensBuilder.push(range, 'parameter');
    }

    processKeyCompile(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument) {
        tokensBuilder.push(range, 'parameter', ['readonly']);
    }

    processValue(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument) {

        // Get the key value document
        if(!range.isSingleLine) return;
        const kvDoc = getDocument(document);
        if(kvDoc == null) return;

        // Get the key value type at that line
        const kv = kvDoc.getKeyValueAt(range.start.line);
        if(kv == null) return;
        const param = shaderParams.find(p => p.name === kv.key);
        if(param == null) {
            this.processValueString(kv, range, tokensBuilder, kvDoc);
            return;
        }
        if(param.type == null || param.type == "") return;

        // Bit copy paste?
        switch(param.type) {
            case "bool": this.processValueBool(kv, range, tokensBuilder, kvDoc); break;
            case "int": this.processValueInt(kv, range, tokensBuilder, kvDoc); break;
            case "float": this.processValueFloat(kv, range, tokensBuilder, kvDoc); break;
            case "scalar": this.processValueScalar(kv, range, tokensBuilder, kvDoc); break;
            case "texture": this.processValueTexture(kv, range, tokensBuilder, kvDoc); break;
            case "color": this.processValueColor(kv, range, tokensBuilder, kvDoc); break;
            case "env_cubemap": this.processValueCubemap(kv, range, tokensBuilder, kvDoc); break;
            
            case "string": 
            default: this.processValueString(kv, range, tokensBuilder, kvDoc); break;
        }
        
    }

    processValueBool(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/^[01]$/)) {
            tokensBuilder.push(range, "boolean");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a boolean (0 or 1).", DiagnosticSeverity.Warning));
        }
    }

    processValueInt(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/^\d+$/)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting an integer.", DiagnosticSeverity.Warning));
        }
    }

    processValueFloat(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/^(\d+)(\.\d+)?$/)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a float.", DiagnosticSeverity.Warning));
        }
    }

    processValueScalar(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/^0?\.\d+$/)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Unexpected shader parameter value type. Expecting a scalar. (0-1)", DiagnosticSeverity.Warning));
        }
    }

    processValueString(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        tokensBuilder.push(range, "string");
    }

    processValueTexture(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {

        if(internalTextures.includes(kv.value)) {
            tokensBuilder.push(range, "keyword");
            return;
        }

        tokensBuilder.push(range, "string");
    }

    processValueColor(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {

        // Don't put any semantic tokens here. The textmate highlighting is good enough. We only validate the input and provide warning messages
        const colorMatches = getColorMatches(kv.value);
        if(!colorMatches.validFormat) {
            this.diagnostics.push(new Diagnostic(range, "Invalid color value. Format: [0 50 255]", DiagnosticSeverity.Warning));
        } else if(colorMatches.outOfBounds) {
            this.diagnostics.push(new Diagnostic(range, "Color values out of bounds. Must be between 0 and 255", DiagnosticSeverity.Warning));
        }
    }

    processValueCubemap(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        
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
                    completion.insertText = new SnippetString(completion.insertText + ' "${1}"');
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
            let hoverText = `(Shader Parameter) **${name}** [${param.type}] ${defaultCompletion != null ? ("- Default: " + defaultCompletion) : ""}`
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
        throw new Error('Method not implemented.');
    }

}

function getColorMatches(colorString: string): { validFormat: boolean, outOfBounds: boolean, color: Color | null, matches: RegExpMatchArray | null }  {
    const matches = colorString.match(/\[(\d{1,3}) (\d{1,3}) (\d{1,3})\]/);
    if(!matches) return {
        validFormat: false,
        outOfBounds: false,
        color: null,
        matches: null
    }

    const r = parseInt(matches[1]);
    const g = parseInt(matches[2]);
    const b = parseInt(matches[3]);

    if(r > 255 || r < 0 || g > 255 || g < 0 || b > 255 || b < 0) return {
        validFormat: true,
        outOfBounds: true,
        color: null,
        matches: matches
    }

    return {
        validFormat: true,
        outOfBounds: false,
        color: new Color(r / 255, g / 255, b / 255, 1),
        matches: matches
    };
}