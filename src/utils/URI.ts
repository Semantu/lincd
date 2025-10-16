/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
export class URI {
  /**
   * Function: sanitize
   * Returns a sanitized string, typically for URLs.
   *
   * Parameters:
   *     $string - The string to sanitize.
   *     $force_lowercase - Force the string to lowercase?
   */
  static sanitize(string) {
    if (!string) return string;
    //\u200B is the ZERO WIDTH SPACE, often introduced by WYSIWYG editors. This causes a hyphen (-) at the end of a string sometimes, so we filter it out first
    return string
      .replace(/\u200B/g, '')
      .replace(/[^\w]+/g, '-')
      .toLowerCase();
  }

  static isURI(uri: string) {
    //must have a scheme followed by ://
    return /([A-Za-z][A-Za-z0-9+\-.]*)\:\/\//.test(uri);
  }

  /**
   * Generate a new URI based on the given URI components (labels / identifiers).
   * This URI will start with the DATA_ROOT environment variable
   * @param uriComponents
   */
  static generate(...uriComponents: string[]) {
    return (
      process.env.DATA_ROOT +
      uriComponents.filter(Boolean).map(encodeURIComponent).join('/')
    );
  }
}
