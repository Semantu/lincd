/// <reference types="node" />
import { IFileStore } from '../interfaces/IFileStore.js';
export declare abstract class LinkedFileStorage {
    private static defaultStore;
    private static url;
    static get accessURL(): string;
    static setDefaultAccessURL(accessURL: string): string;
    static getDefaultStore(): IFileStore;
    static setDefaultStore(store: IFileStore): void;
    static deleteFile(filePath: string): Promise<void>;
    static fileExists(filePath: string): Promise<boolean>;
    static getFile(filePath: string): Promise<Buffer>;
    static listFiles(recursive?: boolean): Promise<string[]>;
    static saveFile(filePath: string, fileContent: Buffer): Promise<string>;
}
/**
 *  Get the full path of an asset based on the way LinkedFileStorage is configured
 *
 * @param path asset path
 * @param directory asset directory (optional, default is /public)
 * @returns asset url. e.g. https://cdn.example.com/public/image.png
 */
export declare function asset(path: string, directory?: string): string;
