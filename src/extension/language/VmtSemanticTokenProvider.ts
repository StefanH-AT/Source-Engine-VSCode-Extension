import vscode from "vscode";
import KvDocument from "./KvDocument";
import { KvTokensProviderBase } from "./KvTokensProviderBase";
import { Token } from "../../kv-core/kv-tokenizer";
import { getParentDocumentDirectory } from "../../kv-core/source-fs";
import { isFloatValue, isScalarValue } from "../../kv-core/kv-string-util";
import { getColorMatches, ColorMatchParenthesisType } from "../../kv-core/kv-color";
import { shaderParams, internalTextures } from "./LangVmt";
import { KvSemanticProcessor, KvSemanticProcessorParams } from "./KvSemanticProcessor";
import { KvPair } from "../Kv";
import { getMatrixMatches } from "../../kv-core/kv-matrix";
import fs from "fs";
import path from "path";


export class VmtSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: KvSemanticProcessor[] = [
        { regex: /\$\w+/, processor: this.processKeyShader },
        { regex: /%\w+/, processor: this.processKeyCompile }
    ];

    protected valueProcessors: KvSemanticProcessor[] = [
        { regex: /.*/, processor: this.processValue }
    ];

    constructor() {
        super(KvDocument.tokenLegend, vscode.languages.createDiagnosticCollection("vmt"));
    }

    processKeyShader(params: KvSemanticProcessorParams): boolean {
        params.tokensBuilder.push(params.wholeRange, "parameter");
        return true;
    }

    processKeyCompile(params: KvSemanticProcessorParams): boolean {
        params.tokensBuilder.push(params.wholeRange, "parameter", ["readonly"]);
        return true;
    }

    processValue(params: KvSemanticProcessorParams): boolean {

        // Get the key value document
        if (!params.kvPiece.range.isSingleLine)
            return false;

        // Get the key value type at that line
        const kv = params.kvDocument.getKeyValueAt(params.kvPiece.range.start.line);
        if (kv == null)
            return false;
        const param = shaderParams.find(p => p.name === kv.key.content);
        if (param == null) {
            this.processValueString(kv, params.wholeRange, params.tokensBuilder, params.kvDocument);
            return false;
        }
        if (param.type == null || param.type == "")
            return false;

        // Bit copy paste?
        switch (param.type) {
        case "bool": this.processValueBool(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "int": this.processValueInt(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "float": this.processValueFloat(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "scalar": this.processValueScalar(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "texture": this.processValueTexture(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "color": this.processValueColor(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "matrix": this.processValueMatrix(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        case "env_cubemap": this.processValueCubemap(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;

        case "string":
        default: this.processValueString(kv, params.wholeRange, params.tokensBuilder, params.kvDocument); break;
        }
        return true;
    }

    processValueBool(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {
        if (kv.value.content.match(/^[01]$/)) {
            tokensBuilder.push(range, "boolean");
        } else {
            this.diagnostics.push(new vscode.Diagnostic(range, "Unexpected shader parameter value type. Expecting a boolean (0 or 1).", vscode.DiagnosticSeverity.Warning));
        }
    }

    processValueInt(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {
        if (kv.value.content.match(/^\d+$/)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new vscode.Diagnostic(range, "Unexpected shader parameter value type. Expecting an integer.", vscode.DiagnosticSeverity.Warning));
        }
    }

    processValueFloat(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {
        if (isFloatValue(kv.value.content)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new vscode.Diagnostic(range, "Unexpected shader parameter value type. Expecting a float.", vscode.DiagnosticSeverity.Warning));
        }
    }

    processValueScalar(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {
        if (isScalarValue(kv.value.content)) {
            tokensBuilder.push(range, "number");
        } else {
            this.diagnostics.push(new vscode.Diagnostic(range, "Unexpected shader parameter value type. Expecting a scalar. (0-1)", vscode.DiagnosticSeverity.Warning));
        }
    }

    processValueString(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {
        tokensBuilder.push(range, "string");
    }

    processValueTexture(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {

        if (internalTextures.includes(kv.value.content)) {
            tokensBuilder.push(range, "keyword");
            return;
        }
        const materialDir = getParentDocumentDirectory(kvDoc.document.uri.fsPath, "materials");
        if (materialDir != null) {
            const materialPath = path.join(materialDir, kv.value + ".vtf");
            if (!fs.existsSync(materialPath)) {
                this.diagnostics.push(new vscode.Diagnostic(range, "Texture not found on disk", vscode.DiagnosticSeverity.Warning));
            }
        }

        tokensBuilder.push(range, "string");
    }

    processValueMatrix(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {

        // Don't put any semantic tokens here. The textmate highlighting is good enough. We only validate the input and provide warning messages
        const matrixMatches = getMatrixMatches(kv.value.content);
        if (!matrixMatches.validFormat) {
            this.diagnostics.push(new vscode.Diagnostic(range, "Invalid matrix format.", vscode.DiagnosticSeverity.Warning));
        }
    }

    processValueColor(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {

        // Don't put any semantic tokens here. The textmate highlighting is good enough. We only validate the input and provide warning messages
        const colorMatches = getColorMatches(kv.value.content);
        if (!colorMatches.validFormat) {
            this.diagnostics.push(new vscode.Diagnostic(range, "Invalid color value. Format: [0 0.25 1] or {0 200 49}", vscode.DiagnosticSeverity.Warning));
            return;
        }
        if (colorMatches.valuesOutOfBounds) {
            if (colorMatches.parenthesisType === ColorMatchParenthesisType.Brackets) {
                this.diagnostics.push(new vscode.Diagnostic(range, "Color values out of bounds. Must be between 0 and 1", vscode.DiagnosticSeverity.Warning));
            } else if (colorMatches.parenthesisType === ColorMatchParenthesisType.Braces) {
                this.diagnostics.push(new vscode.Diagnostic(range, "Color values out of bounds. Must be between 0 and 255", vscode.DiagnosticSeverity.Warning));
            }
        }
    }

    processValueCubemap(kv: KvPair, range: vscode.Range, tokensBuilder: vscode.SemanticTokensBuilder, kvDoc: KvDocument): void {

        if (kv.value.content === "env_cubemap") {
            tokensBuilder.push(range, "keyword");
        } else {
            tokensBuilder.push(range, "string");
        }

    }

    protected override disallowDuplicate(scopedKey: string, depth: number, token: Token): boolean {
        return depth === 1; // Disallow duplicates on shader parameters
    }
}
