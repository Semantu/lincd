/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {DefaultGraph as TFDefaultGraph} from 'rdflib/lib/tf-types';
import {DefaultGraphTermType} from 'rdflib/lib/types';
import {defaultGraphURI} from 'rdflib/lib/utils/default-graph-uri';
import {Graph} from './Graph';

class DefaultGraph extends Graph implements TFDefaultGraph {
	value: '' = '';
	termType: typeof DefaultGraphTermType = DefaultGraphTermType;

	uri = defaultGraphURI;

	constructor() {
		//empty string for default graph URI (part of the standard)
		//https://rdf.js.org/data-model-spec/#defaultgraph-interface
		super('');
	}

	toString() {
		return 'DefaultGraph';
	}
}

export const defaultGraph = new DefaultGraph();
