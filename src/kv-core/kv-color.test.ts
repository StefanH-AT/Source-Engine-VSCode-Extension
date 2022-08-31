import { getColorMatches, ColorMatchDescription, ColorMatchParenthesisType } from "./kv-color";

test("Color Matches Valid 0-255", () => {
    const desc = getColorMatches("{0 255 10}");
    expect(desc.validFormat).toBe(true);
    expect(desc.r).toBe(0);
    expect(desc.g).toBe(1);
    expect(desc.b).toBeCloseTo(0.0392);
    expect(desc.a).toBe(1);
    expect(desc.parenthesisType).toBe(ColorMatchParenthesisType.Braces);
});

test("Color Matches Valid 0-1", () => {
    const desc = getColorMatches("[0 1 0.1]");
    expect(desc.validFormat).toBe(true);
    expect(desc.r).toBe(0);
    expect(desc.g).toBe(1);
    expect(desc.b).toBe(0.1);
    expect(desc.a).toBe(1);
    expect(desc.parenthesisType).toBe(ColorMatchParenthesisType.Brackets);
});

test("Color Matches Invalid", () => {
    const desc = getColorMatches("hi");
    expect(desc.validFormat).toBe(false);
});

test("Color Matches Oob 0-255", () => {
    const desc = getColorMatches("{270 0 1}");
    expect(desc.validFormat).toBe(true);
    expect(desc.valuesOutOfBounds).toBe(true);
    expect(desc.parenthesisType).toBe(ColorMatchParenthesisType.Braces);
});

test("Color Matches Oob 0-1", () => {
    const desc = getColorMatches("[0 0 3]");
    expect(desc.validFormat).toBe(true);
    expect(desc.valuesOutOfBounds).toBe(true);
    expect(desc.parenthesisType).toBe(ColorMatchParenthesisType.Brackets);
});