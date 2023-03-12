// ==========================================================================
// Purpose:
// Implementations of language utility providers for the captions language.
// ==========================================================================

import vscode, { window } from "vscode";
import KvDocument from "./KvDocument";
//import { KvDocumentFormatter } from "./KvFormatter";
import { CaptionsColorsProvider } from "./CaptionsColorsProvider";
import { CaptionsSemanticTokenProvider } from "./CaptionsSemanticTokenProvider";

export const filterCaptionsSaved: vscode.DocumentFilter = {
    language: "captions",
    scheme: "file"
};
export const filterCaptionsUnsaved: vscode.DocumentFilter = {
    language: "captions",
    scheme: "untitled"
};

export const selectorAll: ReadonlyArray<vscode.DocumentFilter> = [filterCaptionsSaved, filterCaptionsUnsaved];

export function init(context: vscode.ExtensionContext): void {
    const captionsColors = vscode.languages.registerColorProvider(selectorAll, new CaptionsColorsProvider());
    const captionsTokenProvider = vscode.languages.registerDocumentSemanticTokensProvider(selectorAll, new CaptionsSemanticTokenProvider(), KvDocument.tokenLegend);
    // TODO: Re-enable formatting here too
    //const captionsFormatter = vscode.languages.registerDocumentFormattingEditProvider(selectorAll, new KvDocumentFormatter());

    const onEditorChange = window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined): void => {
        if (editor === undefined) return;
        if (editor.document.languageId !== "captions") return;

        recommendCompilerSetup(context);
    });

    context.subscriptions.push(captionsColors, captionsTokenProvider, onEditorChange);
}

function recommendCompilerSetup(context: vscode.ExtensionContext): void {
    
    const alreadyRecommended = context.globalState.get("captionsCompiler.recommended", false);

    if(alreadyRecommended) return;

    window.showInformationMessage("Captions can be compiled in the editor using the launch button on the top right. Do you want to set up the compiler?", 
        "Set up compiler", "Ask later", "Don't ask again")
        .then((value: string | undefined) => { 
            if(value === "Set up compiler") {
                vscode.commands.executeCommand("workbench.action.openSettings", "sourceEngine.captionCompiler");
            }

            if(value === "Ask later") return;

            context.globalState.update("captionsCompiler.recommended", true);
        });
}