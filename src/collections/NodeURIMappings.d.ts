import { BlankNode, NamedNode } from '../models.js';
import { NodeMap } from './NodeMap.js';
import { NodeSet } from './NodeSet.js';
export declare class NodeURIMappings extends NodeMap<NamedNode> {
    originalUris: Map<string, string>;
    /**
     * Will create a blanknode the first time you give a certain URI
     * and return the same blanknode when you request it again.
     * Note that the blanknode itself will have its own local URI regardless of the give URI
     * this method allows you to parse a set of data that
     * uses a certain identifier for a certain blanknode across several places
     * and convert it to a local blanknode
     * @param {string} givenUri
     * @returns {BlankNode}
     */
    getOrCreateBlankNode(givenUri: string): BlankNode;
    getBlankNodes(): NodeSet<BlankNode>;
    getOrCreateNamedNode(uri: string): NamedNode;
    getOriginalUri(localUri: string): string;
}
