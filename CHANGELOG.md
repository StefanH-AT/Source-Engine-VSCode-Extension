# Change Log

All notable changes to the "source-engine-support" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.1]

- Add keyvalue file support
  - Auto detect gameinfo.txt
- Add VMT file support
  - Shader parameter suggestion
  - List of parameters can be configured

## [0.0.2]

- Add FGD support
  - Includes srctools preprocessor support

## [0.0.3]

- Add captions support
  - Auto-detect if a .txt file is a captions file
  - Add highlighting for formatting
  - Add color preview for clr tag

## [0.0.4]

- Ported everything to typescript
- Simplified kv3 tmlanguage implementation
- Implemented semantic kv3 token provider
  - Fixed [#1](https://github.com/StefanH-AT/Source-Engine-VSCode-Extension/issues/1)
  - Implemented error handling for missing keys and bracket imbalance
  - Parse and highlight number values in quotes

## [0.0.5]

- Added marketplace icon
- Fixed quote matching
- Fixed captions file type getting selected for all .txt files
- Fixed some captions tmLanguage bugs

## [0.0.6]

**General**
- Added duplicate key detection

**VMT**
- Added parameter name completion
- Added texture name completion (Looks through your filesystem to find .vtf files)
- Added default parameter value completion
- Added parameter value type checking
- Updated shader parameter configuration scheme