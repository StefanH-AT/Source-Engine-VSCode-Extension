import { Range, SemanticTokensBuilder, SemanticTokensLegend, languages, TextDocument } from 'vscode';
import { KvTokensProviderBase } from './keyvalue-parser/kv-token-provider-base';
import { Token, TokenType } from './keyvalue-parser/kv-tokenizer';

export const legend = new SemanticTokensLegend([
    'struct',
    'comment',
    'variable',
    'string',
    'number',
    'operator'
], [
    'declaration'
]);

export class KeyvalueSemanticTokensProvider extends KvTokensProviderBase {

    protected keyProcessors: { processor: Function; regex: RegExp; }[] = [];
    protected valueProcessors: { processor: Function; regex: RegExp; }[] =
    [
        { regex: /^\d+(\.\d+)?$/, processor: this.processValueNumber },
        { regex: /^(\{|\[)((\d+(\.\d+)? ?)+)(\}|\])$/, processor: this.processValueArray }
    ];

    constructor() {
        super(legend, languages.createDiagnosticCollection('keyvalue3'));
    }
    
    processValueNumber(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        tokensBuilder.push(range, 'number', []);
    }

    processValueArray(content: string, range: Range, tokensBuilder: SemanticTokensBuilder, captures: RegExpMatchArray) {
        // [] {}
        tokensBuilder.push(new Range(range.start, range.start.translate(0, 1)), 'operator', []);
        tokensBuilder.push(new Range(range.end.translate(0, -1), range.end), 'operator', []);

        tokensBuilder.push(new Range(range.start.translate(0, 1), range.end.translate(0, -1)), 'number', [])
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
        if(tokens.length == 2 && tokens[0].type === TokenType.String && tokens[1].type === TokenType.String) {
            const key = tokens[0].value;
            const value = tokens[1].value;
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            const valueRange = new Range(this.document.positionAt(tokens[1].start), this.document.positionAt(tokens[1].end));
            return new KeyValue(key, value, keyRange, valueRange);
        }

        if(tokens.length == 1 && tokens[0].type === TokenType.String) {
            const keyRange = new Range(this.document.positionAt(tokens[0].start), this.document.positionAt(tokens[0].end));
            return new KeyValue(tokens[0].value, "", keyRange, keyRange.with(keyRange.end, keyRange.end.translate(1)));
        }

        return null;
        
    }

    public findTokensInRange(range: Range): Token[] {
        
        return this._tokens.filter(t => {
            let startPos = this._document.positionAt(t.start);
            let endPos = this.document.positionAt(t.end);
            return startPos.isAfterOrEqual(range.start) && startPos.isBefore(range.end) && endPos.isAfter(range.start) && endPos.isBeforeOrEqual(range.end);
        });

    }

}