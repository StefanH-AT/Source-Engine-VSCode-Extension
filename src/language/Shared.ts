import { DocumentFilter } from "vscode";

export const languageIdKeyvalue = "keyvalue3";
export const languageIdVmt = "vmt";
export const languageIdSoundscript = "soundscript";
export const languageIdCaptions = "captions";

export function isAnyExtensionLanguageId(id: string): boolean {
    return id === languageIdKeyvalue || id === languageIdVmt || id === languageIdSoundscript || id === languageIdCaptions;
}

export const filterKvSaved: DocumentFilter = {
    language: languageIdKeyvalue,
    scheme: "file"
};
export const filterKvUnsaved: DocumentFilter = {
    language: languageIdKeyvalue,
    scheme: "untitled"
};
export const filterSoundscriptSaved: DocumentFilter = {
    language: languageIdSoundscript,
    scheme: "file"
};
export const filterSoundscriptUnsaved: DocumentFilter = {
    language: languageIdSoundscript,
    scheme: "untitled"
};
export const filterVmtSaved: DocumentFilter = {
    language: languageIdVmt,
    scheme: "file"
};
export const filterVmtUnsaved: DocumentFilter = {
    language: languageIdVmt,
    scheme: "untitled"
};