import { readFileSync } from "fs";
import { formatTokens } from "./kv-formatter";
import { Token, Tokenizer } from "./kv-tokenizer";


test("Formatting Pentest 1, Bracket on Newline", () => {
    
    const tokens = getTokensFor("samples/pentest/test1.kv");

    const formattedStringNotNewline = formatTokens(tokens, false);
    expect(formattedStringNotNewline).toBe(
`// """"" should be ignored
"Root1" {
\t"Key" "Value"
\t"Extra" "Spaces"
\t// "Commented" "out"
\t"Block" {
\t\t"Empty" {
\t\t}
\t}
\t"Block" // "with value"
\t{
\t\tbare {
\t\t\t"block" "he\\\\tre"
\t\t}
\t}
}
`);


});

test("Formatting Pentest 1, Bracket on Newline", () => {

    const tokens = getTokensFor("samples/pentest/test1.kv");

    const formattedStringNewline = formatTokens(tokens, true);
    expect(formattedStringNewline).toBe(
        `// """"" should be ignored
"Root1"
{
\t"Key" "Value"
\t"Extra" "Spaces"
\t// "Commented" "out"
\t"Block"
\t{
\t\t"Empty"
\t\t{
\t\t}
\t}
\t"Block" // "with value"
\t{
\t\tbare
\t\t{
\t\t\t"block" "he\\\\tre"
\t\t}
\t}
}
`);

});

function getTokensFor(filePath: string): Token[] {
    const testFile = readFileSync(filePath, "utf-8");
        
    expect(testFile).not.toBeNull();

    const tokenizer = new Tokenizer();
    tokenizer.tokenizeFile(testFile);
    const tokens = tokenizer.tokens;
    expect(tokens).not.toBeNull();
    expect(tokens.length).toBe(24);

    return tokens;
}