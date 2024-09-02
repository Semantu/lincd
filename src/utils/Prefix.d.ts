import { CoreMap } from '../collections/CoreMap.js';
export declare class Prefix {
    static uriToPrefix: CoreMap<string, string>;
    static prefixToUri: CoreMap<string, string>;
    static getUriToPrefixMap(): CoreMap<string, string>;
    static getPrefixToUriMap(): CoreMap<string, string>;
    static add(prefix: string, fullURI: string): void;
    static delete(prefix: string): void;
    static clear(): void;
    static getPrefix(fullURI: string): string;
    static getFullURI(prefix: string): string;
    static findMatch(fullURI: string): [string, string, string] | [];
    static toPrefixed(fullURI: string): string;
    static toPrefixedIfPossible(fullURI: string): string;
    /**
     * Converts a prefixed URI back to its full URI
     * Will return the prefixed URI if no prefix was found
     * @param uri
     */
    static toFull(uri: any): string;
}
