import vscode from "vscode";
import KvDocument from "./KvDocument";
import { shaderParams, internalTextures } from "./LangVmt";
import { KvPair } from "../Kv";
import { ShaderParam } from "@sourcelib/vmt";
import { getParentDocumentDirectory } from "@sourcelib/fs";
import { listFilesSync } from "list-files-in-dir";
import fs from "fs";
import path from "path";


export class ShaderParamCompletionItemProvider implements vscode.CompletionItemProvider {

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, cancellationToken: vscode.CancellationToken): vscode.CompletionList {

        const kvDoc = KvDocument.from(document);
        if (kvDoc == null)
            return new vscode.CompletionList();
        const kv = kvDoc.getKeyValueAt(position.line);

        if (kv == null)
            return new vscode.CompletionList();

        // FIXME: Eww!
        if (kv.key.range.contains(position)) {
            const suggestions = shaderParams.filter(p => p.name.includes(kv.key.content));
            const completions = suggestions.map(s => {
                const completion = new vscode.CompletionItem(s.name);
                completion.insertText = s.name.substring(1);
                if (s.description != null) {
                    completion.documentation = new vscode.MarkdownString(s.description);
                }

                if (s.defaultCompletion != null) {
                    completion.insertText += " " + s.defaultCompletion.toString();
                } else if (s.type === "string" || s.type === "texture") {
                    completion.insertText = new vscode.SnippetString(completion.insertText + " \"${1}\"");
                }

                if (s.type === "texture") {
                    completion.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions" };
                }

                return completion;
            });

            return new vscode.CompletionList(completions);
        }


        if (kv.value.range.contains(position)) {
            const param = shaderParams.find(p => p.name == kv.key.content);

            const completions = new vscode.CompletionList();

            if (param == null)
                return new vscode.CompletionList();

            // Completion contributors below here
            this.completeDefault(completions, document, kv, param);
            this.completeTexturePath(completions, document, kv, param);


            return completions;

        }

        return new vscode.CompletionList();

    }

    completeDefault(completions: vscode.CompletionList, document: vscode.TextDocument, kv: KvPair, param: ShaderParam): void {
        if (param.defaultCompletion == null)
            return;
        const completion = new vscode.CompletionItem(param.defaultCompletion.toString());
        completion.detail = "Default Completion";
        completion.kind = vscode.CompletionItemKind.Value;
        completions.items.push(completion);
    }

    completeTexturePath(completions: vscode.CompletionList, document: vscode.TextDocument, kv: KvPair, param: ShaderParam): void {
        if (param.type !== "texture" && document.uri.scheme !== "file")
            return;

        internalTextures.forEach(rt => {
            const completion = new vscode.CompletionItem(rt);
            completion.detail = "Internal engine texture";
            completion.kind = vscode.CompletionItemKind.Keyword;
            completions.items.push(completion);
        });

        const materialRoot = getParentDocumentDirectory(document.uri.fsPath, "materials");
        if (materialRoot == null)
            return;

        // Exit early if file already exists
        if (fs.existsSync(path.join(materialRoot, kv.value + ".vtf"))) {
            return;
        }

        let cursorStartDir: string;
        if (kv.value.content.endsWith("\\") || kv.value.content.endsWith("/")) {
            cursorStartDir = kv.value.content;
        } else {
            cursorStartDir = path.dirname(kv.value.content);
        }
        const startDir = path.join(materialRoot, cursorStartDir);

        if (!fs.existsSync(startDir))
            return;

        const textureFiles = listFilesSync(startDir, "vtf");
        textureFiles.forEach(t => {
            let filePath = t.substring(startDir.length);
            if (filePath.startsWith("\\") || filePath.startsWith("/")) {
                filePath = filePath.slice(1);
            }
            const filePathWithoutExtension = filePath.substring(0, filePath.length - 4).replace("\\", "/");

            const completion = new vscode.CompletionItem(filePathWithoutExtension);
            completion.insertText = filePathWithoutExtension;
            completion.detail = "Texture Path";
            completion.kind = vscode.CompletionItemKind.File;
            completion.preselect = true;
            completions.items.push(completion);
        });

    }
}
