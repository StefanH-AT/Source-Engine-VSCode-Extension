// ==========================================================================
// Purpose:
// Basic string functions for keyvalue tokenization
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

export function isWhitespace(char: string) {
    return char === " " || char === "\t" || char === "\n" || char === "\r";
}

export function isQuoted(text: string): boolean {
    return (text.startsWith('"') && text.endsWith('"')) || 
           (text.startsWith("'") && text.endsWith("'"));
}

export function stripQuotes(text: string) {
    if(isQuoted(text)) {
        return text.substring(1, text.length - 1);
    } else return text;
}