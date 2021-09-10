import { Range, TextDocument } from "vscode";
import { Token, TokenType } from "./keyvalue-parser/kv-tokenizer";

const keyvalueDocuments: { file: string, document: KeyvalueDocument }[] = [];

export function getDocument(document: TextDocument): KeyvalueDocument | undefined {
    return keyvalueDocuments.find(d => d.file === document.uri.path)?.document;
}

export function hasDocument(document: TextDocument): boolean {
    return keyvalueDocuments.some(d => d.file === document.uri.path);
}

export function addDocument(document: TextDocument, tokens: Token[]): void {
    const kvDoc = new KeyvalueDocument(document, tokens);
    if(hasDocument(document)) {
        const kvd = keyvalueDocuments.find(kd => kd.file);
        if(kvd == null) return;
        kvd.document = kvDoc;
    } else {
        keyvalueDocuments.push({ file: document.uri.path, document: kvDoc });
    }
}

export class KeyvalueDocument {

    protected _document: TextDocument;
    protected _tokens: Token[];
    
    public get document() : TextDocument {
        return this._document;
    }
    
    constructor(document: TextDocument, tokens: Token[]) {
        this._document = document;
        this._tokens = tokens;
    }

    public getKeyValueAt(lineNumber: number) : KeyValue | null {

        const line = this._document.lineAt(lineNumber);
        if(line.isEmptyOrWhitespace) return null;

        const range = line.range;
        const tokens = this.findTokensInRange(range);

        // FIXME: Very repetetive code
        if(tokens.length == 2 && tokens[0].type === TokenType.Key && tokens[1].type === TokenType.Value) {
            const key = tokens[0].value;
            const value = tokens[1].value;
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            const valueRange = new Range(this.document.positionAt(tokens[1].start), this.document.positionAt(tokens[1].end));
            return new KeyValue(key, value, keyRange, valueRange);
        }

        if(tokens.length == 1 && tokens[0].type === TokenType.Key) {
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            return new KeyValue(tokens[0].value, "", keyRange, keyRange.with(keyRange.end, keyRange.end.translate(1)));
        }

        return null;
        
    }

    public getAllValueTokens(): Token[] {
        return this._tokens.filter(t => t.type === TokenType.Value);
    }

    public findTokensInRange(range: Range): Token[] {
        
        return this._tokens.filter(t => {
            let startPos = this._document.positionAt(t.start);
            let endPos = this.document.positionAt(t.end);
            return startPos.isAfterOrEqual(range.start) && startPos.isBefore(range.end) && endPos.isAfter(range.start) && endPos.isBeforeOrEqual(range.end);
        });

    }

}

export class KeyValue {

    public key: string;
    public keyRange: Range;
    public value: string;
    public valueRange: Range;

    constructor(key: string, value: string, keyRange: Range, valueRange: Range) {
        this.key = key;
        this.value = value;
        this.keyRange = keyRange;
        this.valueRange = valueRange;
    }

}