// ==========================================================================
// Purpose:
// Tests for string util functions
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

import { isQuoted, isWhitespace, stripQuotes } from "./kv-string-util";

test("Is Quoted", () => {
    expect(isQuoted("")).toBeFalsy();
    expect(isQuoted("hi")).toBeFalsy();
    expect(isQuoted("'hi'")).toBeTruthy();
    expect(isQuoted("\"hi\"")).toBeTruthy();

    expect(isQuoted("'hi\"")).toBeFalsy();

    expect(isQuoted("'hi")).toBeFalsy();
});

test("Strip Quotes", () => {
    expect(stripQuotes("")).toBe("");
    expect(stripQuotes("'")).toBe("'");
    expect(stripQuotes("''")).toBe("");
    expect(stripQuotes("hi")).toBe("hi");
    expect(stripQuotes("\"hi\"")).toBe("hi");
    expect(stripQuotes("\"hi")).toBe("\"hi");
});

test("IsWhitespace", () => {
    expect(isWhitespace("")).toBeFalsy();
    expect(isWhitespace("a")).toBeFalsy();
    expect(isWhitespace(" ")).toBeTruthy();
    expect(isWhitespace("\t")).toBeTruthy();
    expect(isWhitespace("\n")).toBeTruthy();
    expect(isWhitespace("\r")).toBeTruthy();
});