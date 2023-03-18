import vscode from "vscode";
import KvDocument from "./KvDocument";
import { TokenType } from "@sourcelib/kv";
import { getColorMatches, shaderParams } from "@sourcelib/vmt";


export class ShaderParamColorsProvider implements vscode.DocumentColorProvider {

    provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ColorInformation[] | null {
        const kvDoc = KvDocument.from(document);
        if (kvDoc == null)
            return null;

        const colorInfos: vscode.ColorInformation[] = [];

        // TODO: This seems like it should be reusable.
        const valueTokens = kvDoc.tokens.getAllOfType(TokenType.Value);
        valueTokens.forEach(t => {
            const line = document.positionAt(t.range.getStart()).line;
            const kv = kvDoc.getKeyValueAt(line);
            if (kv == null)
                return;

            const param = shaderParams.find(p => p.name === kv.key.content);
            if (param == null)
                return;

            if (param.type !== "color")
                return;

            const colorMatches = getColorMatches(kv.value.content);
            if (!colorMatches.validFormat || colorMatches.valuesOutOfBounds)
                return;

            const color = new vscode.Color(colorMatches.r, colorMatches.g, colorMatches.b, colorMatches.a);
            const colorInfo = new vscode.ColorInformation(kv.value.range, color);
            colorInfos.push(colorInfo);
        });

        return colorInfos;
    }

    provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument; range: vscode.Range; }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ColorPresentation[]> {
        return [];
    }

}
