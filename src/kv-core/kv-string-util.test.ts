// ==========================================================================
// Purpose:
// Tests for string util functions
// ==========================================================================

import { isFloatValue, isIntegerValue, isQuoted, isScalarValue, isWhitespace, stripQuotes } from "./kv-string-util";

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

test("Is Float", () => {
    expect(isFloatValue("")).toBeFalsy();
    expect(isFloatValue("aaa")).toBeFalsy();
    expect(isFloatValue("hi3.04fgdf")).toBeFalsy();
    expect(isFloatValue("0")).toBeTruthy();
    expect(isFloatValue("0.0")).toBeTruthy();
    expect(isFloatValue("1")).toBeTruthy();
    expect(isFloatValue("1.0")).toBeTruthy();
    expect(isFloatValue("3.1415")).toBeTruthy();
    expect(isFloatValue(".1")).toBeTruthy();
    expect(isFloatValue("0.1")).toBeTruthy();
    expect(isFloatValue("277.00")).toBeTruthy();
    expect(isFloatValue("-277.00")).toBeTruthy();
});

test("Is Scalar", () => {
    expect(isScalarValue("")).toBeFalsy();
    expect(isScalarValue("aaa")).toBeFalsy();
    expect(isScalarValue("hi3.04fgdf")).toBeFalsy();
    expect(isScalarValue("0")).toBeTruthy();
    expect(isScalarValue("0.0")).toBeTruthy();
    expect(isScalarValue("1")).toBeTruthy();
    expect(isScalarValue("1.0")).toBeTruthy();
    expect(isScalarValue("3.1415")).toBeFalsy();
    expect(isScalarValue(".1")).toBeTruthy();
    expect(isScalarValue("0.1")).toBeTruthy();
    expect(isScalarValue("277.00")).toBeFalsy();
});

test("Is Integer", () => {
    expect(isIntegerValue("")).toBeFalsy();
    expect(isIntegerValue("aaa")).toBeFalsy();
    expect(isIntegerValue("hi3.04fgdf")).toBeFalsy();
    expect(isIntegerValue("0")).toBeTruthy();
    expect(isIntegerValue("0.0")).toBeFalsy();
    expect(isIntegerValue("1")).toBeTruthy();
    expect(isIntegerValue("1.0")).toBeFalsy();
    expect(isIntegerValue("3.1415")).toBeFalsy();
    expect(isIntegerValue(".1")).toBeFalsy();
    expect(isIntegerValue("0.1")).toBeFalsy();
    expect(isIntegerValue("277")).toBeTruthy();
    expect(isIntegerValue("277.00")).toBeFalsy();
    expect(isIntegerValue("-277")).toBeTruthy();
});