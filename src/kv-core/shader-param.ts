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
    public defaultCompletion?: string | boolean | number;
    public description?: string;
    public wikiUri?: string;

    constructor(name: string, type: string, defaultCompletion: string, description: string, wikiUri: string) {
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