import { KvPiece } from "../Kv";
import { Range, SemanticTokensBuilder } from "vscode";
import KvDocument from "./KvDocument";

export type KvSemanticProcessorFunction = (options: KvSemanticProcessorParams) => boolean;

export interface KvSemanticProcessorParams {
    kvPiece: KvPiece;
    wholeRange: Range;
    tokensBuilder: SemanticTokensBuilder;
    captures: RegExpMatchArray;
    kvDocument: KvDocument;
    scope: string;
}

export class KvSemanticProcessor {
    public processor: KvSemanticProcessorFunction;
    public regex = /.+/;

    constructor(processor: KvSemanticProcessorFunction, regex: RegExp) {
        this.processor = processor;
        this.regex = regex;
    }
}
