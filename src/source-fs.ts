export function getParentDocumentDirectory(path: string, directoryName: string): string | null {

    const materialPathIndex = path.indexOf("materials") + "materials".length;
    if(materialPathIndex < 0) return null;

    return path.substring(0, materialPathIndex);;
}