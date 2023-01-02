import * as vscode from "vscode";
import { KvPair, KvPiece } from "../Kv";
import { Tokenizer, TokenList, Token, TokenType } from "@sourcelib/kv";
import { KvTokensProviderBase } from "./KvTokensProviderBase";

export default class KvDocument {

    protected _document: vscode.TextDocument;
    protected _tokens: TokenList;

    public get document(): vscode.TextDocument {
        return this._document;
    }

    public get tokens(): TokenList {
        return this._tokens;
    }

    private static tokenizer: Tokenizer = new Tokenizer();

    public static tokenize(document: vscode.TextDocument): TokenList {
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

    private constructor(document: vscode.TextDocument, tks: TokenList) {
        this._document = document;
        this._tokens = tks;
    }

    public getKeyValueAt(lineNumber: number): KvPair | null {

        const line = this._document.lineAt(lineNumber);
        if (line.isEmptyOrWhitespace)
            return null;
        const tokens = this.tokens.getAllOnLine(lineNumber);

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

    public getTokenRange(token: Token): vscode.Range {
        return new vscode.Range(this.document.positionAt(token.range.start), this.document.positionAt(token.range.end));
    }

    private getUnquotedToken(token: Token): KvPiece {
        const range = this.getTokenRange(token);
        return KvTokensProviderBase.unquoteToken(token, range);
    }

}
