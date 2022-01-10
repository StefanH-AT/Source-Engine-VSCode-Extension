// ==========================================================================
// Purpose:
// Reads tag out of captions data for highlighting and other processing
// ==========================================================================

export class ClrTagInfo {

    public color: Color;

    // These ranges start at the keyvalue value index!
    public start: number;
    public end: number;

    constructor(color: Color, start: number, end: number) {
        this.color = color;
        this.start = start;
        this.end = end;
    }

}

export class Color {

    public r: number;
    public g: number;
    public b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

}

export function populateColorTagMatches(line: string): ClrTagInfo[] {

    const colorTags: ClrTagInfo[] = [];

    const clrMatches = [...line.matchAll(/<clr:(\d{1,3}),(\d{1,3}),(\d{1,3})>/g)];
    clrMatches.forEach(match => {
        const color = new Color(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));

        const wholeString = match[0];
        const posStart = line.indexOf(wholeString);
        const posEnd = posStart + wholeString.length;
        colorTags.push(new ClrTagInfo(color, posStart + 5, posEnd - 1));
    });

    const playerclrMatches = [...line.matchAll(/<playerclr:(\d{1,3}),(\d{1,3}),(\d{1,3}):(\d{1,3}),(\d{1,3}),(\d{1,3})>/g)];
    playerclrMatches.forEach(match => {
        const color1 = new Color(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        const color2 = new Color(parseInt(match[4]), parseInt(match[5]), parseInt(match[6]));

        const start1 = line.indexOf(":") + 1;
        const end1 = line.lastIndexOf(":");
        const end2 = line.lastIndexOf(match[6]) + match[6].length; // Javascript, why don't you just allow me to get the index of the match?

        colorTags.push(new ClrTagInfo(color1, start1, end1), new ClrTagInfo(color2, end1 + 1, end2));
    });

    return colorTags;

}