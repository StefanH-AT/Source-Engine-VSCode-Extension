import * as tokenizer from './kv-tokenizer'

test("Tokenize File", () => {
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
            
                    "multiline string"   """this
string is multi-line
and spans many lines"""
                }
            
                Unquoted
                {
                    key val
                }
            
            }
        }
    `);
    expect(tkn).toBeDefined;

    const tokens = tkn.tokens;
    expect(tokens).toBeDefined;
    expect(tokens.length).toBe(48);

    expect(tokens[0].value).toBe('"File"');
    expect(tokens[1].value).toBe('{');
    expect(tokens[2].value).toBe('"Keyvalues"');
    expect(tokens[3].value).toBe('{');
    expect(tokens[4].value).toBe('// A comment');

});

test("Consume Unquoted string", () => {
    const tkn = new tokenizer.Tokenizer();
    tkn.text = "hello_this_is_an_unquoted_string";
    expect(tkn.consumeStringUnquoted(0)).toBe(tkn.text.length + 1);
    tkn.text = "key value";
    expect(tkn.consumeStringUnquoted(0)).toBe(4);
    expect(tkn.consumeStringUnquoted(4)).toBe(6);
})