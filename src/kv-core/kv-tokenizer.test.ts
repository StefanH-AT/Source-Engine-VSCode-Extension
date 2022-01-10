// ==========================================================================
// Purpose:
// Tests for keyvalue file tokenizer
// ==========================================================================

import * as tokenizer from "./kv-tokenizer";

test("Tokenize Simple KV", () => {
    const tkn = new tokenizer.Tokenizer();
    tkn.tokenizeFile(`
        "File"
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
    expect(tokens[0].type).toBe(tokenizer.TokenType.Key);
    expect(tokens[1].value).toBe("{");
    expect(tokens[2].value).toBe("\"Keyvalues\"");
    expect(tokens[3].value).toBe("{");
    expect(tokens[4].value).toBe("// A comment");
    expect(tokens[5].value).toBe("\"Quoted Strings\"");
    expect(tokens[5].type).toBe(tokenizer.TokenType.Key);
    expect(tokens[6].value).toBe("\"a a\"");
    expect(tokens[6].type).toBe(tokenizer.TokenType.Value);
    expect(tokens[7].value).toBe("// Comment after the line");

    expect(tokens[50].type).toBe(tokenizer.TokenType.Value);
    expect(tokens[50].value).toBe("\"\\\"world\\\"\"");

});

test("Tokenize preprocessor", () => {
    const tkn = new tokenizer.Tokenizer();
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
    expect(tokens[0].type).toBe(tokenizer.TokenType.Comment);
    expect(tokens[1].type).toBe(tokenizer.TokenType.PreprocessorKey);
    expect(tokens[2].type).toBe(tokenizer.TokenType.Value);
    expect(tokens[3].type).toBe(tokenizer.TokenType.Key);
    expect(tokens[4].type).toBe(tokenizer.TokenType.ObjectStart);
    expect(tokens[5].type).toBe(tokenizer.TokenType.PreprocessorKey);
    expect(tokens[6].type).toBe(tokenizer.TokenType.Value);
    expect(tokens[7].type).toBe(tokenizer.TokenType.Key);
    expect(tokens[8].type).toBe(tokenizer.TokenType.Value);
    expect(tokens[9].type).toBe(tokenizer.TokenType.ObjectEnd);
});

test("Consume Unquoted string", () => {
    const tkn = new tokenizer.Tokenizer();
    tkn.text = "hello_this_is_an_unquoted_string";
    expect(tkn.consumeStringUnquoted(0)).toBe(tkn.text.length + 1);
    tkn.text = "key value";
    expect(tkn.consumeStringUnquoted(0)).toBe(4);
    expect(tkn.consumeStringUnquoted(4)).toBe(6);
});

