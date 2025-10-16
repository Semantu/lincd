/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode,NamedNode} from '../models.js';
import {NodeMap} from './NodeMap.js';
import {NodeSet} from './NodeSet.js';

//TODO: rename to something more fitting now that it also handles TMP NamedNodes
export class NodeURIMappings extends NodeMap<NamedNode> {
  originalUris: Map<string, string> = new Map();

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
  getOrCreateBlankNode(givenUri: string): BlankNode {
    //TODO: rename this method to getOrCreateBlankNode
    if (this.has(givenUri)) {
      return this.get(givenUri);
    } else {
      var blankNode: BlankNode = new BlankNode();
      this.set(givenUri, blankNode);
      this.originalUris.set(blankNode.uri, givenUri);
      return blankNode;
    }
  }

  getBlankNodes(): NodeSet<BlankNode> {
    return new NodeSet(this.filter((n) => n instanceof BlankNode).values());
  }

  getOrCreateNamedNode(uri: string): NamedNode {
    //the temp URI's in one environment may already be used in another environment
    //so we need to check for temporary URI's and convert them to a local temporary URI
    if (
      uri.substring(0, NamedNode.TEMP_URI_BASE.length) ==
      NamedNode.TEMP_URI_BASE
    ) {
      if (!this.has(uri)) {
        //create a new temp node that has a LOCAL temp URI
        var tmpResource: NamedNode = NamedNode.create();
        this.set(uri, tmpResource);
        this.originalUris.set(tmpResource.uri, uri);
        return tmpResource;
      }
      return this.get(uri);
    }
    return NamedNode.getOrCreate(uri);
  }

  getOriginalUri(localUri: string) {
    //return the original uri, and if we dont have a mapping it will not have changed
    return this.originalUris.get(localUri) || localUri;
  }
}
