import vscode from "vscode";
import KvDocument from "./KvDocument";
import { KvTokensProviderBase } from "./KvTokensProviderBase";
import { KvSemanticProcessor, KvSemanticProcessorParams } from "./KvSemanticProcessor";


export class CaptionsSemanticTokenProvider extends KvTokensProviderBase {

    protected keyProcessors: KvSemanticProcessor[] = [
        { regex: /.*/, processor: this.processKey }
    ];
    protected valueProcessors: KvSemanticProcessor[] = [
        { regex: /.*/, processor: this.processValue }
    ];

    constructor() {
        super(KvDocument.tokenLegend, vscode.languages.createDiagnosticCollection("captions"));
    }

    processKey(params: KvSemanticProcessorParams): boolean {
        params.tokensBuilder.push(params.wholeRange, "parameter");
        return true;
    }

    processValue(params: KvSemanticProcessorParams): boolean {

        if (params.scope === ".lang.tokens") {
            return true; // Don't add a semantic token to  lang values and let tmLanguage handle it.
        }
        params.tokensBuilder.push(params.wholeRange, "string");
        return true;
    }

}
