import * as vscode from "vscode";
import { KvPair, KvPiece } from "../Kv";
import { Token, Tokenizer, TokenType } from "../../kv-core/kv-tokenizer";
import { KvTokensProviderBase } from "./KvTokensProviderBase";

export default class KvDocument {

    protected _document: vscode.TextDocument;
    protected _tokens: Token[];

    public get document(): vscode.TextDocument {
        return this._document;
    }

    public get tokens(): Token[] {
        return this._tokens;
    }

    private static tokenizer: Tokenizer = new Tokenizer();

    public static tokenize(document: vscode.TextDocument): Token[] {
        const text = document.getText();
        this.tokenizer.tokenizeFile(text);
        const tokens = this.tokenizer.tokens;
    
        return tokens;
    }

    public static from(document: vscode.TextDocument): KvDocument {
        return new KvDocument(document, this.tokenize(document));
    }

    public static tokenLegend = new vscode.SemanticTokensLegend([
        "struct",
        "comment",
        "variable",
        "string",
        "number",
        "operator",
        "macro",
        "boolean",
        "keyword",
        "parameter"
    ], [
        "declaration",
        "readonly"
    ]);

    private constructor(document: vscode.TextDocument, tks: Token[]) {
        this._document = document;
        this._tokens = tks;
    }

    public getKeyValueAt(lineNumber: number): KvPair | null {

        const line = this._document.lineAt(lineNumber);
        if (line.isEmptyOrWhitespace)
            return null;
        const tokens = this.findTokensOnLine(lineNumber);

        // Normal old keyvalue
        if (tokens.length == 0)
            return null;

        let keyPiece: KvPiece | null = null;
        const valuePieces: KvPiece[] = [];
        for (const token of tokens) {
            switch (token.type) {
            case TokenType.Key:
                keyPiece = this.getUnquotedToken(token); break;
            case TokenType.Value:
                valuePieces.push(this.getUnquotedToken(token)); break;
            }
        }

        if (keyPiece == null)
            return null;

        return new KvPair(keyPiece, valuePieces);
    }

    public getAllValueTokens(): Token[] {
        return this._tokens.filter(t => t.type === TokenType.Value);
    }

    public getAllTokens(): Token[] {
        return this._tokens;
    }

    public findTokensOnLine(line: number): Token[] {
        return this._tokens.filter(t => t.line == line);
    }

    private getTokenRange(token: Token): vscode.Range {
        return new vscode.Range(this.document.positionAt(token.start), this.document.positionAt(token.end));
    }

    private getUnquotedToken(token: Token): KvPiece {
        const range = this.getTokenRange(token);
        return KvTokensProviderBase.unquoteToken(token, range);
    }

}
