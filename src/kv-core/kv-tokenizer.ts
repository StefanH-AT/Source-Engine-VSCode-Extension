import { isWhitespace } from "./kv-string-util";
import { performance } from "perf_hooks";

export enum TokenType {
    Comment,
    Key,
    Value,
    ObjectStart,
    ObjectEnd,
    PreprocessorKey,
    Conditional
}

export class Token {
    type: TokenType;
    start: number;
    end: number;
    value: string;
    line: number;

    constructor(type: TokenType, start: number, end: number, value: string, line: number) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.value = value;
        this.line = line;
    }
}

export class Tokenizer {

    text = "";

    _tokens : Token[] = [];

    _preprocessorRegex = /#(base|include)/;

    
    addToken(type: TokenType, start: number, end: number, value: string, line: number): void {
        this._tokens.push(new Token(type, start, end, value, line));
    }
    
    public get tokens(): Token[] {
        return this._tokens;
    }
    
    _tokenizeFileFunction = performance.timerify(this.tokenizeFileInternal);
    public tokenizeFile(text: string): void {
        this._tokenizeFileFunction(text);
    }
    /**
     * Sets basic tokens for the file provided. The semantic token provider must do analysis on these, as it's not done here. These tokens could be in illegal positions, but since we might want to do different analysis depending on the keyvalue format (eg VMT), it's better to analyse later.
     * @param text The text of the file to tokenize
     */
    private tokenizeFileInternal(text: string): void {
        const textSize = text.length;
        this.text = text;
        this._tokens = [];
        
        let line = 0;
        let expectingKey = true;
        for(let i = 0; i < textSize; i++) {
            const c = text[i];

            // Skip forward to the next interesting token
            if(c === " " || c === "\t") continue;
            if(c === "\r" || c === "\n") {
                if(c === "\n") {
                    line++;
                }
                expectingKey = true;
                continue;
            }

            // Is it a comment?
            if(c === "/" && text[i + 1] === "/") {
                const commentLength = this.consumeComment(i + 2);
                this.addToken(TokenType.Comment, i, i + commentLength, text.substring(i, i + commentLength), line);
                i += commentLength - 1;
                continue;
            }

            // Is it an object?
            if(c === "{") {
                this.addToken(TokenType.ObjectStart, i, i, text[i], line);
                expectingKey = true;
                continue;
            }
            if(c === "}") {
                this.addToken(TokenType.ObjectEnd, i, i, text[i], line);
                continue;
            }

            // Is it a conditional?
            if(c === "[") {
                const conditionalLength = this.consumeConditional(i);
                this.addToken(TokenType.Conditional, i, i + conditionalLength, text.substring(i, i + conditionalLength), line);
                i += conditionalLength - 1;
                continue;
            }

            // No, it's a string!
            const stringLength = this.consumeString(i);
            const stringContent = text.substring(i, i + stringLength);
            let tokenType = expectingKey ? TokenType.Key : TokenType.Value;

            // Are we a preprocessor key?

            if(expectingKey && stringContent.match(this._preprocessorRegex)) {
                tokenType = TokenType.PreprocessorKey;
            }

            this.addToken(tokenType, i, i + stringLength, stringContent, line);
            if(expectingKey) expectingKey = false;
            i += stringLength - 1; // Prevents skipping the next character after the string
            continue;
        }
    }

    consumeComment(i: number): number {
        let n = 1;
        let c = this.text[i];
        for(; c != null; c = this.text[i + n++]) {
            if(c === "\n" || c === "\r") {
                break;
            }
        }

        return n + 1;
    }

    consumeConditional(i: number): number {
        let n = 1;
        let c = this.text[i];
        for(; c != null; c = this.text[i + n++]) {
            if(c === "]" || c === "\n" || c === "\r") {
                break;
            }
        }
        return n;
    }

    consumeString(i: number): number {
        const c = this.text[i];

        // Is it quoted?
        if(c === "\"" || c === "'") {
            
            // Multiline?
            if(this.text[i + 0] === "\"" &&
                this.text[i + 1] === "\"" &&
                this.text[i + 2] === "\"") {
                return this.consumeStringMultiline(i + 3);
            } else {
                return this.consumeStringQuoted(i + 1, c);
            }
        } else {
            return this.consumeStringUnquoted(i + 1);
        }


    }

    consumeStringQuoted(i: number, startingQuote: string): number {
        let n = 1;
        let escaped = false;
        let c = this.text[i];
        for(; c != null; c = this.text[i + n++]) {
            if(c === "\n") {
                return n;
            }
            if(c === "\\") {
                escaped = !escaped;
                continue;
            }

            if(c === startingQuote) {
                if(escaped) {
                    escaped = false;
                    continue;
                } else {
                    break;
                }
            } else {
                if(escaped) escaped = false;
            }
        }

        return n + 1;
    }

    consumeStringMultiline(i: number): number {
        let n = 1;
        let escaped = false;
        let c = this.text[i];
        for(; c != null; c = this.text[i + n]) {
            if(c === "\\") {
                escaped = true;
                continue;
            }

            if(c === "\"") {
                if(escaped) continue;
                
                const c1 = this.text[i + n + 1];
                const c2 = this.text[i + n + 2];

                if(c1 === "\"" && c2 === "\"") {
                    break;
                }
            }

            n++;
        }

        return n + 5;
    }

    consumeStringUnquoted(i: number): number {
        let n = 0;
        for(; i + n < this.text.length && !isWhitespace(this.text[i + n]); n++);
        return n + 1;
    }
    
}