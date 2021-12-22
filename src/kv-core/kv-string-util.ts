// ==========================================================================
// Purpose:
// Basic string functions for keyvalue tokenization
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

export const regexScalar = /^((0?\.\d+)|([10]?\.\d+)|[01])$/;
export const regexFloat = /^-?((\d+)|(\d*\.\d+))$/;
export const regexInteger = /^-?\d+$/;

export function isWhitespace(char: string): boolean {
    return char === " " || char === "\t" || char === "\n" || char === "\r";
}

export function isQuoted(text: string): boolean {
    return (text.startsWith("\"") && text.endsWith("\"")) || 
           (text.startsWith("'") && text.endsWith("'"));
}

export function stripQuotes(text: string): string {
    if(isQuoted(text)) {
        return text.substring(1, text.length - 1);
    } else return text;
}

function isMatchingValue(str: string, regex: RegExp) {
    const matches = str.match(regex);
    return matches != null;
}

export function isFloatValue(n: string): boolean {
    return isMatchingValue(n, regexFloat);
}

export function isIntegerValue(n: string): boolean {
    return isMatchingValue(n, regexInteger);
}

export function isScalarValue(n: string): boolean {
    return isMatchingValue(n, regexScalar);
}