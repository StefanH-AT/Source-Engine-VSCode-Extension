export enum ColorMatchParenthesisType {
    None,
    Brackets,
    Braces,
    Inconsistent
}

export class ColorMatchDescription {
    r = 0;
    g = 0;
    b = 0;
    a = 1;
    validFormat = false;
    valuesOutOfBounds = false;
    parenthesisType: ColorMatchParenthesisType = ColorMatchParenthesisType.None;
}

function createInvalidColor(): ColorMatchDescription {
    return new ColorMatchDescription();
}

function createOutOfBounds(parenthesisType: ColorMatchParenthesisType): ColorMatchDescription {
    const desc = new ColorMatchDescription();
    desc.validFormat = true;
    desc.valuesOutOfBounds = true;
    desc.parenthesisType = parenthesisType;
    return desc;
}

// Rgb must be between 0 and 255
function createValid(r: number, g: number, b: number, parenthesisType: ColorMatchParenthesisType): ColorMatchDescription {
    const desc = new ColorMatchDescription();
    desc.r = r;
    desc.g = g;
    desc.b = b;
    desc.validFormat = true;
    desc.parenthesisType = parenthesisType;
    return desc;
}

function createInconsistent(): ColorMatchDescription {
    const desc = new ColorMatchDescription();
    desc.parenthesisType = ColorMatchParenthesisType.Inconsistent;
    return desc;
}

function isSameParenSet(p1: string, p2: string): boolean {
    return p1 === "{" && p2 === "}" || p1 === "[" && p2 === "]";
}

export function getColorMatches(colorString: string): ColorMatchDescription {
    // Regex matches color syntax [1 0 0.3] or {255 0 4}
    // Matches more than the actual syntax allows to allow for more specific analysis and error messages later on instead of just not matching
    const matches = colorString.match(/ *(\[|\{) *(-?\d*\.?\d+) *(-?\d*\.?\d+) *(-?\d*\.?\d+) *(\]|\}) */);
    if(!matches) return new ColorMatchDescription();

    const p1 = matches[1];
    const p2 = matches[5];
    if(!isSameParenSet(p1, p2)) {
        return createInconsistent();
    }
    let is255 = false;
    const limitMin = 0;
    let limitMax = 1;
    if(p1 === "{") {
        is255 = true;
        limitMax = 255;
    }
    const parenType = is255 ? ColorMatchParenthesisType.Braces : ColorMatchParenthesisType.Brackets

    let r = parseFloat(matches[2]);
    let g = parseFloat(matches[3]);
    let b = parseFloat(matches[4]);
    
    if(r > limitMax || r < limitMin || g > limitMax || g < limitMin || b > limitMax || b < limitMin) {
        return createOutOfBounds(parenType);
    }
    if(!is255) {
        r *= 255;
        g *= 255;
        b *= 255;
    }

    return createValid(r, g, b, parenType);
}