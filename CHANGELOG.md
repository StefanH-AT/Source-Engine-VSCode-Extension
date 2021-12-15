# Change Log

All notable changes to the "source-engine-support" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.18]

**General**
- Fix bugs where certain language features would be broken before opening a keyvalue, vmt or captions file

## [0.0.17]

**QC**
- Added button to compile a .QC file (Must configure studiomdl.exe path)

**Captions**
- Fixed colorization bugs on large files

## [0.0.16]

**General**
- Fixed tokenization bugs
- Added tokenization support for #include and #base. (Auto complete and other features coming later)

## [0.0.15]

**General**
- Semantic token improvements
- Other small bug fixes

**Captions**
- Added a button to compile a captions file. (Must configure captioncompiler.exe path)

## [0.0.14]

**General**
- Fixed and improved tokenizer
- Fixed keyvalue docs not being tokenized sometimes
- Keyvalue file formatting rewrite

## [0.0.13]

**General**
- Lots of bug fixes
- More snippets

## [0.0.12]

**General**
- Big refactor
- Disabled duplicate key warning by default

**VMT**
- Enabled duplicate key warning only on shader parameters

**Captions**
- Added formatting
- Added tokenization
- Improved `<clr>` tag colorization
- Added `<playerclr>` tag colorization
- Added snippets for tags and to create a new file

## [0.0.11]

**General**
- Added auto indentation and formatting for keyvalue files. Only enabled in .vmt for now

**QC**
- Added basic QC highlighting

## [0.0.10]

**General**
- Added .vmf, .vmx and .acf file extensions to use keyvalue language highlighting

**VMT**
- Added further rendertarget textures

**VPC**
- Added first rudimentary support for VPC based on JJL77's implementation

## [0.0.9]

**General**
- Added .vdf extension to keyvalue language

**CFG**
- Added basic .cfg file highlighting

## [0.0.8]

**VMT**
- Added color value highlighting and validation
- Added snippets for material templates

## [0.0.7]

**VMT**
- Fixed shader parameter value regex not matching exactly

## [0.0.6]

**General**
- Added duplicate key detection

**VMT**
- Added parameter name completion
- Added texture name completion (Looks through your filesystem to find .vtf files)
- Added default parameter value completion
- Added parameter value type checking
- Updated shader parameter configuration scheme
- Added more shader parameters to the default config

## [0.0.5]

- Added marketplace icon
- Fixed quote matching
- Fixed captions file type getting selected for all .txt files
- Fixed some captions tmLanguage bugs

## [0.0.4]

- Ported everything to typescript
- Simplified kv3 tmlanguage implementation
- Implemented semantic kv3 token provider
  - Fixed [#1](https://github.com/StefanH-AT/Source-Engine-VSCode-Extension/issues/1)
  - Implemented error handling for missing keys and bracket imbalance
  - Parse and highlight number values in quotes

## [0.0.3]

- Add captions support
  - Auto-detect if a .txt file is a captions file
  - Add highlighting for formatting
  - Add color preview for clr tag

## [0.0.2]

- Add FGD support
  - Includes srctools preprocessor support

## [0.0.1]

- Add keyvalue file support
  - Auto detect gameinfo.txt
- Add VMT file support
  - Shader parameter suggestion
  - List of parameters can be configured
