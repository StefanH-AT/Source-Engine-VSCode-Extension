import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem, CompletionList, Range, SemanticTokensBuilder, SemanticTokensLegend, languages, HoverProvider, Hover, ProviderResult, Diagnostic, DiagnosticSeverity } from 'vscode'
import { KeyvalueDocument, getDocument, KeyValue } from './keyvalue-document';
import { KvTokensProviderBase } from './keyvalue-parser/kv-token-provider-base';
import { Tokenizer } from './keyvalue-parser/kv-tokenizer';
import { ShaderParam } from './shader-param';
import { listFilesSync } from 'list-files-in-dir'

export const legend = new SemanticTokensLegend([
    'struct',
    'comment',
    'variable',
    'string',
    'number',
    'boolean',
    'operator',
    'keyword'
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

export class ParameterHint {

    public param: string;
    public valueRegex: RegExp;

    constructor(param: string, valueRegex: RegExp) {
        this.param = param;
        this.valueRegex = valueRegex;
    }

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
        tokensBuilder.push(range, 'keyword');
    }

    processKeyCompile(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument) {
        tokensBuilder.push(range, 'keyword', ['readonly']);
    }

    processValue(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray, document: TextDocument) {

        // Get the key value document
        if(!range.isSingleLine) return;
        const kvDoc = getDocument(document);
        if(kvDoc == null) return;

        // Get the key value type at that line
        const kv = kvDoc.getKeyValueAt(range.start.line);
        if(kv == null) return;
        const type = shaderParams.find(p => kv.key)?.type;
        if(type == null || type == "") return;

        // Bit copy paste?
        switch(type) {
            case "bool": this.processValueBool(kv, range, tokensBuilder, kvDoc); break;
            case "int": this.processValueInt(kv, range, tokensBuilder, kvDoc); break;
            case "float": this.processValueFloat(kv, range, tokensBuilder, kvDoc); break;
            case "scalar": this.processValueScalar(kv, range, tokensBuilder, kvDoc); break;
            case "texture": this.processValueTexture(kv, range, tokensBuilder, kvDoc); break;
            case "string": this.processValueString(kv, range, tokensBuilder, kvDoc); break;
            case "color": this.processValueColor(kv, range, tokensBuilder, kvDoc); break;
        }
        
    }

    processValueBool(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/[01]/g)) {
            tokensBuilder.push(range, "boolean");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Illegal shader parameter value type. Expecting a boolean (0 or 1).", DiagnosticSeverity.Warning));
        }
    }

    processValueInt(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/\d+/g)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Illegal shader parameter value type. Expecting an integer.", DiagnosticSeverity.Warning));
        }
    }

    processValueFloat(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/(\d+)(\.\d+)?/g)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Illegal shader parameter value type. Expecting a float.", DiagnosticSeverity.Warning));
        }
    }

    processValueScalar(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        if(kv.value.match(/0?\.\d+/g)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new Diagnostic(range, "Illegal shader parameter value type. Expecting a scalar. (0-1)", DiagnosticSeverity.Warning));
        }
    }

    processValueString(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        tokensBuilder.push(range, "string");
    }

    processValueTexture(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        tokensBuilder.push(range, "string");
    }

    processValueColor(kv: KeyValue, range: Range, tokensBuilder: SemanticTokensBuilder, kvDoc: KeyvalueDocument) {
        tokensBuilder.push(range, "string"); // TODO: Interpret colors
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

        if(kv?.keyRange.contains(position) && kv.key !== "") {
            const param = shaderParams.find(p => p.name == kv.key);

            if(param == null) return null;

            const name = param.name;
            const defaultCompletion = param.defaultCompletion;
            const description = param.description;
            const uri = param.wikiUri;

            let hoverText = `(Shader Parameter) **${name}** ${defaultCompletion != null ? ("- Default: " + defaultCompletion) : ""}`
            if(description != null) hoverText += `\n\n${description}`;
            if(uri != null) hoverText += `\n\n[Wiki](${uri})`;

            return new Hover(hoverText, kv.keyRange);

        }

        return null;
    }

}