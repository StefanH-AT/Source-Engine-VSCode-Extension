// ==========================================================================
// Purpose:
// Utility functions to navigate in a source-engine-like filesystem.
// 
// Author: Stefan Heinz
//
// https://github.com/StefanH-AT/Source-Engine-VSCode-Extension
// ==========================================================================

export function getParentDocumentDirectory(path: string, directoryName: string): string | null {

    const materialPathIndex = path.indexOf(directoryName) + directoryName.length;
    if(materialPathIndex < 0) return null;

    return path.substring(0, materialPathIndex);
}