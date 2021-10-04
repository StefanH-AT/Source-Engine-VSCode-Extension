import { Token, TokenType } from "./kv-tokenizer";

export function formatTokens(tokens: Token[], bracketOnNewline: boolean): string {
    let indentation = 0;
    let text = "";

    for(let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        const indent = "\t".repeat(indentation);

        if(token.type === TokenType.ObjectStart) {
            indentation++;
            if(text.endsWith("\n")) {
                text += indent + "{\n";
                continue;
            }
            if(bracketOnNewline) {
                text += "\n" + indent + "{\n";
            } else {
                text += " {\n";
            }
        } else if(token.type === TokenType.ObjectEnd) {
            indentation--;
            text += indent.substring(1) + "}\n";
        } else if(token.type === TokenType.Key) {
            text += indent + token.value;
        } else if(token.type === TokenType.Value) {
            text += " " + token.value + "\n";
        } else if(token.type === TokenType.Comment) {
            const comment = token.value.substring(2).trimStart();
            const putIndent = text.endsWith("\n") || (text.length === 0);
            text += (putIndent ? indent : " ") + "// " + comment + "\n";
        }

    }

    return text;
}