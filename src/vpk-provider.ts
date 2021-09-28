import { Disposable, Event, EventEmitter, ExtensionContext, FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri, workspace } from "vscode";

export function init(context: ExtensionContext): void {
    workspace.registerFileSystemProvider("vpk", new VpkFileSystemProvider());
}

export class VpkFileSystemProvider implements FileSystemProvider {

    private _emitter = new EventEmitter<Array<FileChangeEvent>>();
    onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

    watch(uri: Uri, options: { recursive: boolean; excludes: string[]; }): Disposable {
        throw new Error("Method not implemented.");
    }
    stat(uri: Uri): FileStat | Thenable<FileStat> {
        throw new Error("Method not implemented.");
    }
    readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
        throw new Error("Method not implemented.");
    }
    createDirectory(uri: Uri): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    readFile(uri: Uri): Uint8Array | Thenable<Uint8Array> {
        throw new Error("Method not implemented.");
    }
    writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    delete(uri: Uri, options: { recursive: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }

}