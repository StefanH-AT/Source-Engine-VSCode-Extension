export const matrixRegExp = / *\[ ((\d+(\.\d+)?|\.\d+) ?|)+\] */;

export function getMatrixMatches(matrixString: string): { validFormat: boolean, values: number[] } {
    const matches = matrixString.match(matrixRegExp);
    if(!matches) return {
        validFormat: false,
        values: []
    };

    const vals = matches[1].split(" ").map(v => parseFloat(v));
    
    return {
        validFormat: true,
        values: vals
    };
}