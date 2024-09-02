"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URI = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var URI = /** @class */ (function () {
    function URI() {
    }
    /**
     * Function: sanitize
     * Returns a sanitized string, typically for URLs.
     *
     * Parameters:
     *     $string - The string to sanitize.
     *     $force_lowercase - Force the string to lowercase?
     */
    URI.sanitize = function (string) {
        if (!string)
            return string;
        //\u200B is the ZERO WIDTH SPACE, often introduced by WYSIWYG editors. This causes a hyphen (-) at the end of a string sometimes, so we filter it out first
        return string
            .replace(/\u200B/g, '')
            .replace(/[^\w]+/g, '-')
            .toLowerCase();
    };
    URI.isURI = function (uri) {
        //must have a scheme followed by ://
        return /([A-Za-z][A-Za-z0-9+\-.]*)\:\/\//.test(uri);
    };
    /**
     * Generate a new URI based on the given URI components (labels / identifiers).
     * This URI will start with the DATA_ROOT environment variable
     * @param uriComponents
     */
    URI.generate = function () {
        var uriComponents = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            uriComponents[_i] = arguments[_i];
        }
        return (process.env.DATA_ROOT +
            uriComponents.filter(Boolean).map(encodeURIComponent).join('/'));
    };
    return URI;
}());
exports.URI = URI;
//# sourceMappingURL=URI.js.map