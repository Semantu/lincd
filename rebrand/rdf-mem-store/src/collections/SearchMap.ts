/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreMap} from '@_linked/core/collections/CoreMap';
import {NamedNode} from '../models.js';
import {NodeSet} from './NodeSet.js';

export class SearchMap extends CoreMap<
  NamedNode | NodeSet<NamedNode> | '*',
  string | NamedNode
> {}
