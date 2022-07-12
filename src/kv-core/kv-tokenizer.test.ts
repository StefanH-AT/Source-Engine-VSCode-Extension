// ==========================================================================
// Purpose:
// Tests for keyvalue file tokenizer
// ==========================================================================

import { Token, Tokenizer, TokenType } from "./kv-tokenizer";

test("Tokenize Simple KV", () => {
    const tkn = new Tokenizer();
    tkn.tokenizeFile(
        `"File"
        {
            "Keyvalues" {

                // A comment
            
    \t\t"Quoted Strings"         "a a"  // Comment after the line
                unquoted_strings        b       // Unquoted strings cannot have spaces
            
                integers                130     // 130
                floats                  5.03    // 
                in_brackets             500.3
            
                "booleans"     \t"true"    //
                booleans                "false"   //
            
                array        \t     "[1.0 0.5 0.0]"     //gf
                
    \tmatrix                  "{255 128 0}"       // {}
            
            
                "Subobject" { // yes {}]]}}}}
                    "key"               "value"

                    "single quote"      "'"
            
                    " string"   "fsdf"
                }
            
                Unquoted
                {
                    key val
                }
            
            }

            more                  {

                hello "\\"world\\""

            }
        }
    `);
    expect(tkn).toBeDefined;

    const tokens = tkn.tokens;
    expect(tokens).toBeDefined;
    expect(tokens.length).toBe(53);

    expect(tokens[0].value).toBe("\"File\"");
    expect(tokens[0].type).toBe(TokenType.Key);
    expect(tokens[0].line).toBe(0);
    expect(tokens[1].value).toBe("{");
    expect(tokens[1].line).toBe(1);
    expect(tokens[2].value).toBe("\"Keyvalues\"");
    expect(tokens[2].line).toBe(2);
    expect(tokens[3].value).toBe("{");
    expect(tokens[3].line).toBe(2);
    expect(tokens[4].value).toBe("// A comment");
    expect(tokens[4].line).toBe(4);
    expect(tokens[5].value).toBe("\"Quoted Strings\"");
    expect(tokens[5].line).toBe(6);
    expect(tokens[5].type).toBe(TokenType.Key);
    expect(tokens[6].value).toBe("\"a a\"");
    expect(tokens[6].line).toBe(6);
    expect(tokens[6].type).toBe(TokenType.Value);
    expect(tokens[7].value).toBe("// Comment after the line");
    expect(tokens[7].line).toBe(6);

    expect(tokens[50].type).toBe(TokenType.Value);
    expect(tokens[50].value).toBe("\"\\\"world\\\"\"");

});

test("Tokenize preprocessor", () => {
    const tkn = new Tokenizer();
    tkn.tokenizeFile(`
    // Example file for a file with preprocessor statements
    
    #base "file_this_is_based_on.txt"
    
    "Obj" {
        #include "some/file.txt"
        "hello" "world :)"
    }`);

    expect(tkn).toBeDefined();

    const tokens = tkn.tokens;
    expect(tokens.length).toBe(10);
    expect(tokens[0].type).toBe(TokenType.Comment);
    expect(tokens[1].type).toBe(TokenType.PreprocessorKey);
    expect(tokens[2].type).toBe(TokenType.Value);
    expect(tokens[3].type).toBe(TokenType.Key);
    expect(tokens[4].type).toBe(TokenType.ObjectStart);
    expect(tokens[5].type).toBe(TokenType.PreprocessorKey);
    expect(tokens[6].type).toBe(TokenType.Value);
    expect(tokens[7].type).toBe(TokenType.Key);
    expect(tokens[8].type).toBe(TokenType.Value);
    expect(tokens[9].type).toBe(TokenType.ObjectEnd);
});

test("Tokenize missing closing quote on string", () => {
    const tkn = new Tokenizer();
    tkn.tokenizeFile(`
    "test" {
        "key1" value1
        "key2" "value2
        "key3" value3"
        "key4 value4

        key5 value5
    }`);

    expect(tkn).toBeDefined();

    const tokens = tkn.tokens;
    expect(tokens.length).toBe(12);
    expect(tokens[2].type).toBe(TokenType.Key);
    expect(tokens[2].value).toBe("\"key1\"");
    expect(tokens[3].type).toBe(TokenType.Value);
    expect(tokens[3].value).toBe("value1");

    expect(tokens[4].type).toBe(TokenType.Key);
    expect(tokens[4].value).toBe("\"key2\"");
    expect(tokens[5].type).toBe(TokenType.Value);
    expect(tokens[5].value).toBe("\"value2");

    expect(tokens[6].type).toBe(TokenType.Key);
    expect(tokens[6].value).toBe("\"key3\"");
    expect(tokens[7].type).toBe(TokenType.Value);
    expect(tokens[7].value).toBe("value3\"");

    expect(tokens[8].type).toBe(TokenType.Key);
    expect(tokens[8].value).toBe("\"key4 value4");

    expect(tokens[9].type).toBe(TokenType.Key);
    expect(tokens[9].value).toBe("key5");
    expect(tokens[10].type).toBe(TokenType.Value);
    expect(tokens[10].value).toBe("value5");
});

test("Tokenize multiple values", () => {
    const tkn = new Tokenizer();
    tkn.tokenizeFile(`Test {
        "key1" "v1" v2 v3 4 // comment
    }`);

    expect(tkn).toBeDefined();

    const tokens = tkn.tokens;
    expect(tokens.length).toBe(9);
    expect(tokens[0].type).toBe(TokenType.Key);
    expect(tokens[1].type).toBe(TokenType.ObjectStart);
    expect(tokens[2].type).toBe(TokenType.Key);
    expect(tokens[3].type).toBe(TokenType.Value);
    expect(tokens[3].value).toBe("\"v1\"");
    expect(tokens[4].type).toBe(TokenType.Value);
    expect(tokens[4].value).toBe("v2");
    expect(tokens[5].type).toBe(TokenType.Value);
    expect(tokens[5].value).toBe("v3");
    expect(tokens[6].type).toBe(TokenType.Value);
    expect(tokens[6].value).toBe("4");
});

test("Tokenize conditionals", () => {
    const tkn = new Tokenizer();
    tkn.tokenizeFile(`Test {
        "k1" "v1" [$TEST]
        "k2" "v2" [ $TEST && ( !$DEBUG ) ]
    }`);

    expect(tkn).toBeDefined();

    const tokens = tkn.tokens;
    expect(tokens.length).toBe(9);
    expect(tokens[0].type).toBe(TokenType.Key);
    expect(tokens[1].type).toBe(TokenType.ObjectStart);
    expect(tokens[2].type).toBe(TokenType.Key);
    expect(tokens[3].type).toBe(TokenType.Value);
    expect(tokens[4].type).toBe(TokenType.Conditional);
    expect(tokens[4].value).toBe("[$TEST]");
    expect(tokens[5].type).toBe(TokenType.Key);
    expect(tokens[5].value).toBe("\"k2\"");
    expect(tokens[6].type).toBe(TokenType.Value);
    expect(tokens[7].type).toBe(TokenType.Conditional);
    expect(tokens[7].value).toBe("[ $TEST && ( !$DEBUG ) ]");
});

test("Consume Unquoted string", () => {
    const tkn = new Tokenizer();
    tkn.text = "hello_this_is_an_unquoted_string";
    expect(tkn.consumeStringUnquoted(0)).toBe(tkn.text.length + 1);
    tkn.text = "key value";
    expect(tkn.consumeStringUnquoted(0)).toBe(4);
    expect(tkn.consumeStringUnquoted(4)).toBe(6);
});

