## Roadmap
### [0.1.0]

**General**
- Duplicate key detection
- Semantic keyvalue file tokenization

**VMT**
- Complete VMT implementation
  - Parameter name completion
  - Parameter value type checking
  - Parameter name docs on hover
  - Color value preview and validation
  - Texture path completion
    - Internal textures, like rendertargets
    - Searching the file tree for .vtf files
  - Material path completion
    - Searching the file tree for .vmt files
  - Snippet templates
  - Unnecessary param value detection (Like `%noportal 0`. It's already the default value, no need to declare it.)

**FGD**
- Basic FGD highlighting (Not semantic)

**Captions**
- Basic Captions highlighting
  - Color preview
  - Highlight tags like `<I> <clr:255 125 0>`

**VPC**
- Basic VPC highlighting (Not semantic)

**QC**
- Basic QC highlighting (Not semantic)
- Common QC snippets

**CFG**
- Basic .cfg highlighting (Not semantic)

### [0.2.0]

**QC**
- Semantic QC tokenization (Good luck with that)
- QC commands autocomplete and snippets
