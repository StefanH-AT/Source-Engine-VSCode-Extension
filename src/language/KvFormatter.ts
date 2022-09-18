import vscode from "vscode";
import { FormattingOptions, formatAll } from "@sourcelib/kv";
import KvDocument from "./KvDocument";
import * as main from "../main";

export class KvDocumentFormatter implements vscode.DocumentFormattingEditProvider {

    protected createFormattingOptions(): FormattingOptions {
        return {
            braceOnNewline: main.config.get("keyvalueBracesOnNewline"),
            alwaysQuote: main.config.get("keyvalueAlwaysQuote")
        } as FormattingOptions;
    }

    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {

        const tokens = KvDocument.tokenize(document);
        if (tokens == null)
            return [];

        const startPos = document.positionAt(0);

        // We just delete and reconstruct the entire file. Much easier.
        const edits: vscode.TextEdit[] = [
            new vscode.TextEdit(new vscode.Range(startPos, document.positionAt(document.getText().length)), "")
        ];

        edits.push(new vscode.TextEdit(new vscode.Range(startPos, startPos), formatAll(tokens, this.createFormattingOptions())));

        return edits;

    }

}
