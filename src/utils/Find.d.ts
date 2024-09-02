import { NodeSet } from '../collections/NodeSet.js';
import { NamedNode } from '../models.js';
import { QuadSet } from '../collections/QuadSet.js';
import { SearchMap } from '../collections/SearchMap.js';
export declare class Find {
    static byPropertyValues(valuesToProperties: SearchMap, targetType?: NamedNode, includeLocalResources?: boolean, exactMatch?: boolean, sanitized?: boolean): QuadSet;
    /**
     * Returns a set of quads where the search value is found and the predicate matches the given property/properties/property-type
     * @param searchValue
     * @param properties a single property, a set of properties, a property type or '*' to indicate ANY property
     * @param targetType only include quads whos subject is of this type
     * @param includeLocalResources if false, temporary / local nodes will be excluded from results
     * @param exactMatch if true, only returns exact matches, if false, returns values that START WITH the given searchValue
     * @param sanitized indicates whether the searchValue has been sanitized
     * @param subjects if given, will only return quads who's subject occurs in this set
     */
    static byPropertyValue(searchValue: string | NamedNode, properties?: NodeSet<NamedNode> | NamedNode | '*', targetType?: NamedNode, includeLocalResources?: boolean, exactMatch?: boolean, sanitized?: boolean, subjects?: NodeSet<NamedNode>): QuadSet;
    private static valueMatches;
}
