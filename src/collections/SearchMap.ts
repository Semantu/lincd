/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from './CoreMap';
import {NamedNode} from '../models/NamedNode';
import {NodeSet} from './NodeSet';

export class SearchMap extends CoreMap<
	NamedNode | NodeSet<NamedNode> | '*',
	string | NamedNode
> {}
