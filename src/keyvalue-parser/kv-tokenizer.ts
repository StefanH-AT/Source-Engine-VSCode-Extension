export enum TokenType {
    Comment,
    String, // All strings receive this token. The semantic token provider should implement analysis on these
    ObjectStart,
    ObjectEnd
}

export class Token {
    type: TokenType;
    start: number;
    end: number;
    value: string;

    constructor(type: TokenType, start: number, end: number, value: string) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.value = value;
    }
}

export class Tokenizer {

    text = "";

    _tokens : Token[] = [];

    addToken(type: TokenType, start: number, end: number, value: string) {
        this._tokens.push(new Token(type, start, end, value));
    }

    public get tokens(): Token[] {
        return this._tokens;
    }

    /**
     * Sets basic tokens for the file provided. The semantic token provider must do analysis on these, as it's not done here. These tokens could be in illegal positions, but since we might want to do different analysis depending on the keyvalue format (eg VMT), it's better to analyse later.
     * @param text The text of the file to tokenize
     */
    public tokenizeFile(text: string) {
        const textSize = text.length;
        this.text = text;
        this._tokens = [];
        for(let i = 0; i < textSize; i++) {
            const c = text[i];

            // Skip forward to the next interesting token
            if(c === " " || c === "\r" || c === "\n" || c === "\t") continue;

            // Is it a comment?
            if(c === "/" && text[i + 1] === "/") {
                const commentLength = this.consumeComment(i + 2);
                this.addToken(TokenType.Comment, i, i + commentLength, text.substring(i, i + commentLength));
                i += commentLength;
                continue;
            }

            // Is it an object?
            if(c === "{") {
                this.addToken(TokenType.ObjectStart, i, i, text[i]);
                continue;
            }
            if(c === "}") {
                this.addToken(TokenType.ObjectEnd, i, i, text[i]);
                continue;
            }

            // No, it's a string!
            const stringLength = this.consumeString(i);
            this.addToken(TokenType.String, i, i + stringLength, text.substring(i, i + stringLength));
            i += stringLength;
        }
    }

    consumeComment(i: number) : number {
        let n = 0;
        while(true) {
            const c = this.text[i + n++];
            if(c == null) break;

            if(c === "\n" || c === "\r") {
                break;
            }
        }

        return n + 1;
    }

    consumeString(i: number) : number {
        const c = this.text[i];

        // Is it quoted?
        if(c === '"' || c === "'") {
            
            // Multiline?
            if(this.text[i + 0] === '"' &&
                this.text[i + 1] === '"' &&
                this.text[i + 2] === '"') {
                    return this.consumeStringMultiline(i + 3);
                } else {
                    return this.consumeStringQuoted(i + 1);
                }
        } else {
            return this.consumeStringUnquoted(i + 1);
        }


    }

    consumeStringQuoted(i: number) : number {
        let n = 0;
        let escaped = false;
        while(true) {
            const c = this.text[i + n++];
            if(c == null) break;
            if(c === '\\') {
                escaped = true;
                continue;
            }

            if(c === '"' || c === "'") {
                if(escaped) continue;
                else break;
            }
        }

        return n + 1;
    }

    consumeStringMultiline(i: number) : number {
        let n = 0;
        let escaped = false;
        while(true) {
            const c = this.text[i + n];
            if(c == null) break;
            if(c === '\\') {
                escaped = true;
                continue;
            }

            if(c === '"') {
                if(escaped) continue;
                
                const c1 = this.text[i + n + 1];
                const c2 = this.text[i + n + 2];

                if(c1 === '"' && c2 === '"') {
                    break;
                }
            }

            n++;
        }

        return n + 5;
    }

    consumeStringUnquoted(i: number) : number {
        for(var n = 0; i + n < this.text.length && !this.isWhitespace(this.text[i + n]); n++) { }
        return n + 1;
    }

    isWhitespace(char: string) {
        return char === " " || char === "\t" || char === "\n" || char === "\r";
    }
}