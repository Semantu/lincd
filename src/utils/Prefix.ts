/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from '../collections/CoreMap';

export class Prefix {
	static uriToPrefix: CoreMap<string, string> = new CoreMap();
	static prefixToUri: CoreMap<string, string> = new CoreMap();

	static getUriToPrefixMap() {
		return this.uriToPrefix;
	}
	static getPrefixToUriMap() {
		return this.prefixToUri;
	}

	static add(prefix: string, fullURI: string) {
		this.uriToPrefix.set(fullURI, prefix);
		this.prefixToUri.set(prefix, fullURI);
	}

	static delete(prefix: string) {
		if (this.prefixToUri.has(prefix)) {
			let fullURI = this.getFullURI(prefix);
			this.uriToPrefix.delete(fullURI);
			this.prefixToUri.delete(prefix);
		}
	}
	static clear() {
		this.uriToPrefix = new CoreMap<string, string>();
		this.prefixToUri = new CoreMap<string, string>();
	}
	static getPrefix(fullURI: string): string {
		if (this.uriToPrefix.has(fullURI)) {
			return this.uriToPrefix.get(fullURI);
		}
		let match = this.findMatch(fullURI);
		if (match) return match[1];
	}
	static getFullURI(prefix: string): string {
		return this.prefixToUri.get(prefix);
	}

	private static findMatch(fullURI: string) {
		for (let [ontologyURI, prefix] of this.uriToPrefix.entries()) {
			if (fullURI.substr(0, ontologyURI.length) == ontologyURI) {
				return [ontologyURI, prefix];
			}
		}
	}

	static toPrefixed(fullURI: string) {
		let match = this.findMatch(fullURI);
		if (match) {
			return match[1] + ':' + fullURI.substr(match[0].length);
		}
	}
	static toPrefixedIfPossible(fullURI: string) {
		return this.toPrefixed(fullURI) || fullURI;
	}

	/**
	 * Converts a prefixed URI back to its full URI
	 * Will return the prefixed URI if no prefix was found
	 * @param uri
	 */
	static toFull(uri) {
		let [prefix, rest] = uri.split(':');
		let ontologyURI = this.getFullURI(prefix);
		if (ontologyURI) {
			return ontologyURI + rest;
		}
		throw new Error(
			'Unknown prefix ' +
				prefix +
				'. Could not convert ' +
				uri +
				' to a full URI',
		);
	}
}
