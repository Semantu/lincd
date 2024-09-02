import { CoreMap } from './CoreMap.js';
import { NamedNode } from '../models.js';
import { NodeSet } from './NodeSet.js';
export declare class SearchMap extends CoreMap<NamedNode | NodeSet<NamedNode> | '*', string | NamedNode> {
}
