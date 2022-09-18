import { Range } from "vscode";

export class KvPair {

    public key: KvPiece;
    public values: KvPiece[];

    constructor(key: KvPiece, values: KvPiece[]) {
        this.key = key;
        this.values = values;
    }

    public get value(): KvPiece {
        return this.values[0];
    }

}

export class KvPiece {
    public content: string;
    public range: Range;

    constructor(content: string, range: Range) {
        this.content = content;
        this.range = range;
    }
}