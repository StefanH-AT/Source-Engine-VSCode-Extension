import vscode from "vscode";
import KvDocument from "./KvDocument";
import { shaderParams } from "./LangVmt";


export class ShaderParamHoverProvider implements vscode.HoverProvider {

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover | null {

        const kvDoc = KvDocument.from(document);
        if (kvDoc == null)
            return null;
        const kv = kvDoc.getKeyValueAt(position.line);

        if (kv == null)
            return null;

        const param = shaderParams.find(p => p.name == kv.key.content);
        if (param == null)
            return null;
        const name = param.name;
        const defaultCompletion = param.defaultCompletion;
        const description = param.description;
        const uri = param.wikiUri;

        if (kv.key.range.contains(position) && kv.key.content !== "") {
            let hoverText = `(Shader Parameter) **${name}** [${param.type}] ${defaultCompletion != null ? ("- Default: " + defaultCompletion) : ""}`;
            if (description != null)
                hoverText += `\n\n${description}`;
            if (uri != null)
                hoverText += `\n\n[Wiki](${uri})`;

            return new vscode.Hover(hoverText, kv.key.range);
        }

        if (kv.value.range.contains(position) && kv.value.content !== "") {
            if (param.type === "env_cubemap" && kv.value.content === "env_cubemap") {
                return new vscode.Hover("Internal Texture, Samples the environment cubemap.");
            }
        }


        return null;
    }

}
