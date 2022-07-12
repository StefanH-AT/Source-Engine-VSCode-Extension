import vscode from "vscode";
import { formatTokens } from "../../kv-core/kv-formatter";
import KvDocument from "./KvDocument";



export class KvDocumentFormatter implements vscode.DocumentFormattingEditProvider {



    protected doPutBracesOnNewline(): boolean {
        const config = vscode.workspace.getConfiguration("sourceEngine");
        return config.get("keyvalueBracesOnNewline") ?? false;
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

        edits.push(new vscode.TextEdit(new vscode.Range(startPos, startPos), formatTokens(tokens, this.doPutBracesOnNewline())));

        return edits;

    }

}
