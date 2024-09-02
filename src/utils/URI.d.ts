export declare class URI {
    /**
     * Function: sanitize
     * Returns a sanitized string, typically for URLs.
     *
     * Parameters:
     *     $string - The string to sanitize.
     *     $force_lowercase - Force the string to lowercase?
     */
    static sanitize(string: any): any;
    static isURI(uri: string): boolean;
    /**
     * Generate a new URI based on the given URI components (labels / identifiers).
     * This URI will start with the DATA_ROOT environment variable
     * @param uriComponents
     */
    static generate(...uriComponents: string[]): string;
}
