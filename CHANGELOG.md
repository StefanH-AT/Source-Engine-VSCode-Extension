# Change Log

All notable changes to the "source-engine-support" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

The versions in this file adhere to [semantic versioning](https://semver.org/).

## [0.10.3]

**FGD**
- Fixed syntax highlighting for HammerAddons unified FGD tags [as reported by Luke18033](https://github.com/StefanH-AT/Source-Engine-VSCode-Extension/issues/99)

## [0.10.2]

**General**
- Fixed negative numbers not being highlighted correctly in keyvalue files

## [0.10.1]

**Captions**

- Improved syntax highlighting for `<I>` and `<B>` tags

## [0.10.0]

**General**
This release contains a major refactor where Source Engine-specific capabilities have been separated into a standalone package, [sourcelib](https://github.com/source-lib/sourcelib). Reformatting in Keyvalue file formats has been disabled until a better implementation is done.

## [0.9.0]

**General**
This is the first release of a major refactor where Source Engine-specific capabilities have been separated into a standalone package, [sourcelib](https://github.com/source-lib/sourcelib). Reformatting in Keyvalue file formats has been disabled until a better implementation is done.

## [0.8.1]

**FXC**
- Apply syntax highlighting to `_fxc.h` files so vscode doesn't open the shader code as a C++ file

## [0.8.0]

**FXC**
- Added syntax highlighting for .fxc (Shader) files based off Vscode's HLSL definition enhanced with special FXC comment syntax

## [0.7.0]

**VMT**
- Added parameters related to decals like `$decal`
- Added `$translucent 1` to decal snippet

**QC**
- Added `$attachment` snippet

## [0.6.3]

**VMT**
- Fixed color preview bugs

## [0.6.2]

**VMT**
- Fixed texture paths always being marked as missing on filesystem

## [0.6.1]

**Other**
- Fixed description for studiomdl path setting (Thanks AWildErin!)

## [0.6.0]

**KeyValue**
- Added rudimentary highlighting to conditionals (The `[$Debug]` syntax which can enable/disable lines depending on certain engine conditions)
- Fixed multiple values breaking syntax highlighting
- Fixed bugs related to unclosed strings
- Fixed bugs related to lookahead tokenization logic

## [0.5.0]

**VMT**
- Added auto completion for texture paths

**SMD**
- Added basic SMD file syntax highlighting

## [0.4.0]

**KeyValue**
- Added keyvalue tokenization performance profiling. Can be optionally enabled in the settings
- Fixed major issues with tokenization that made language features break frequently. This will make language features much more reliable in all keyvalue files and its decendents
- Fixed syntax highlighting for negative numbers

**VMT**
- Improved support for color value detection and added brace syntax (`{255 0 30}`)
- Fixed issues with matrix value detection
- Fixed `$fogcolor`'s default completion value

**QC**
- Added more snippets for QC values (Thanks LoveRenamon!)
- Added syntax highlighting for macros (variables) e.g: `$body $bodyname$` (Thanks LoveRenamon!)

## [0.3.8]

**FGD**
- Fix `BaseClass` not getting detected as a valid class definition

## [0.3.7]

**General**
- Added automatic indentation detection
- Other bugfixes

**Soundscripts**
- Fixed bracket and quote pair problems

**VPC**
- Added `$QtFile` keyword

**QC, Captions**
- Compile button is now hidden when file is unsaved

## [0.3.6]

**KeyValue**
- Fixed negative and float number highlighting. Affects all keyvalue-like file formats

**QC**
- Added highlighting for QC macros or variables (Thanks LoveRenamon!)
- Fixed bracket and quote pair problems

## [0.3.5]

**VPC**
- Fixed bracket and quote pair problems

**VMT**
- Added new 'matrix' shader parameter type for validation
- Corrected some VMT shader parameter types

## [0.3.4]

**QC**
- Fixed block comments (/* */) not working for QC files

## [0.3.3]

**General**
- Added project homepage to package.json

## [0.3.2]

**General**
- Add working directory settings for compilation tools

**Captions**
- Fix `<I>` and `<B>` tags highlighting the entire rest of the file if not closed

## [0.3.1]

**General**
- Fixed config changes not applying until the editor is restarted

## [0.3.0]

**VMT**
- Fixed warning annotation on color values with spaces around the brackets

**Soundscript**
- Added new soundscript language
- Added snippets for soundscripts

## [0.2.0]

**General**
- Fixed a bug which caused most intelligent language features to fail in VMT for example

**VMT**
- Added more shader parameter definitions for common parameters related to `$detail`

## [0.1.0]

**RAD**
- Added lights.rad syntax highlighting

## [0.0.26]

This is a test release

## [0.0.25]

This is a test release

## [0.0.24]

This is a test release

## [0.0.23]

CI/CD fixes

## [0.0.22]

**General**
- Bugfixes

## [0.0.21]

**General**
- Bugfixes

## [0.0.20]

**VMT**
- Fixed incorrect color value hint

**FGD**
- Added more snippets

**QC**
- Added more snippets

## [0.0.19]

**VMT**
- Fixed scalar values not accepting 0 and 1
- Fixed color array values accepting 0-255 not 0-1

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
