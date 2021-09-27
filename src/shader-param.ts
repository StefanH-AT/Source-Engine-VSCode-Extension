// ==========================================================================
// Purpose:
// Object model for shader parameter information that is used to give hints, inspections and error detection for the vmt language.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

export class ShaderParam {

    public name: string;
    public type: string;
    public defaultCompletion: string | null | undefined;
    public description: string | null | undefined;
    public wikiUri: string | null | undefined;

    constructor(name: string, type: string, defaultCompletion: string | null, description: string, wikiUri: string | null) {
        this.name = name;
        this.type = type;
        this.defaultCompletion = defaultCompletion;
        this.description = description;
        this.wikiUri = wikiUri;
    }

}

export class ShaderParamHint {

    public paramName: string;
    public valueRegex: RegExp;

    constructor(paramName: string, valueRegex: RegExp) {
        this.paramName = paramName;
        this.valueRegex = valueRegex;
    }

}