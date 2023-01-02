import vscode from "vscode";
import KvDocument from "./KvDocument";
import {  populateColorTagMatches, ClrTagInfo } from "@sourcelib/captions";

export class CaptionsColorsProvider implements vscode.DocumentColorProvider {

    provideDocumentColors(document: vscode.TextDocument, cancellationToken: vscode.CancellationToken): vscode.ColorInformation[] {
        const lines = document.lineCount;

        const kvDoc = KvDocument.from(document);
        if (kvDoc == null)
            return [];

        const colorInfos: vscode.ColorInformation[] = [];

        for (let i = 0; i < lines; i++) {
            if (cancellationToken.isCancellationRequested)
                break;

            // Get a line that isn't empty
            const kv = kvDoc.getKeyValueAt(i);
            if (kv == null)
                continue;

            const clrInfo: ClrTagInfo[] = populateColorTagMatches(kv.value.content);
            clrInfo.forEach((clr) => {
                const colorInfo = new vscode.ColorInformation(kv.value.range.with(kv.value.range.start.translate(0, clr.start), kv.value.range.start.translate(0, clr.end)),
                    new vscode.Color(clr.color.r / 255, clr.color.g / 255, clr.color.b / 255, 1.0));
                colorInfos.push(colorInfo);
            });
        }

        return colorInfos;
    }

    provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument; range: vscode.Range; }, cancellationToken: vscode.CancellationToken): vscode.ColorPresentation[] {
        return [];
    }
}
