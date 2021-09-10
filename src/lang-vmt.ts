import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList, Range, SemanticTokensBuilder, SemanticTokensLegend, languages, HoverProvider, Hover, ProviderResult, Diagnostic, DiagnosticSeverity, DocumentColorProvider, Color, ColorInformation, ColorPresentation } from 'vscode'
import { KeyvalueDocument, getDocument, KeyValue } from './keyvalue-document';
import { KvTokensProviderBase } from './keyvalue-parser/kv-token-provider-base';
import { Tokenizer } from './keyvalue-parser/kv-tokenizer';
import { ShaderParam } from './shader-param';
import { listFilesSync } from 'list-files-in-dir'
import { assert } from 'console';

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

export let shaderParams: ShaderParam[];
export let internalTextures: string[];

export function initShaderParams(params: ShaderParam[], intTextures: string[]) {
    shaderParams = params;
    internalTextures = intTextures;
}

export class VmtSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: { processor: Function; regex: RegExp; }[] = [
        { regex: /\$\w+/, processor: this.processKeyShader },
        { regex: /\%\w+/, processor: this.processKeyCompile }
    ];

    protected valueProcessors: { processor: Function; regex: RegExp; }[] = [
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
                completion.documentation = `${s.description}`;
                if(s.defaultCompletion != null) {
                    completion.insertText += " " + s.defaultCompletion.toString();
                }
                return completion;
            });
            
            return new CompletionList(completions);
        }

        if(kv.valueRange.contains(position) && kv.value === "") {
            const param = shaderParams.find(p => p.name == kv.key);

            const completions = new CompletionList();

            if(param == null) return new CompletionList();

            if(param.defaultCompletion != null) {
                const completion = new CompletionItem(param.defaultCompletion.toString());
                completion.detail = "Default Completion";
                completions.items.push( completion );
            }

            // TODO: Make this texture path code more reusable
            if(param.type === "texture" && document.uri.scheme === "file") {
                const path = document.uri.path;
                const materialPathIndex = path.indexOf("materials") + "materials".length;

                internalTextures.forEach(rt => {
                    const completion = new CompletionItem(rt);
                    completion.detail = "Internal";
                    completions.items.push(completion);
                });

                if(materialPathIndex > 0) {
                    const materialRoot = path.substring(0, materialPathIndex);
                    const textureFiles = listFilesSync(materialRoot, "vtf");
                    textureFiles.forEach( t => {
                        const completion = new CompletionItem(t.substring(materialPathIndex + 1));
                        completion.insertText = t.substring(materialPathIndex + 1, t.length - 4);
                        completion.detail = "Texture Path";
                        completions.items.push(completion);
                    });
                } 
            }

            return completions;

        }

        return new CompletionList();
        
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