import { readFileSync } from "fs";
import { formatTokens } from "./kv-formatter";
import { Token, Tokenizer } from "./kv-tokenizer";


test("Simple Formatting 1, Bracket not on Newline", () => {
    
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

test("Simple Formatting 1, Bracket on Newline", () => {

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

test("Preprocessor Formatting", () => {

    const tokens = getTokensFor("samples/pentest/test_preprocessor.kv");

    const formattedStringNewline = formatTokens(tokens, true);
    expect(formattedStringNewline).toBe(
        `// Example file for a file with preprocessor statements
#base "file_this_is_based_on.txt"
"Obj"
{
\t#include "some/file.txt"
\t"hello" "world :)"
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

    return tokens;
}