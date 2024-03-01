/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeSet} from '../collections/NodeSet.js';
import {NamedNode, Node, Quad} from '../models.js';
import {rdf} from '../ontologies/rdf.js';
import {rdfs} from '../ontologies/rdfs.js';
import {QuadSet} from '../collections/QuadSet.js';
import {URI} from './URI.js';
import {ICoreIterable} from '../interfaces/ICoreIterable.js';
import {SearchMap} from '../collections/SearchMap.js';

export class Find {
  static byPropertyValues(
    valuesToProperties: SearchMap,
    targetType?: NamedNode,
    includeLocalResources: boolean = true,
    exactMatch: boolean = true,
    sanitized: boolean = true,
  ): QuadSet {
    // var results =new NodeSet<NamedNode>();
    let result = new QuadSet();
    let subjects: NodeSet<NamedNode>;

    valuesToProperties.forEach(
      (
        searchValue: string | NamedNode,
        properties: NamedNode | NodeSet<NamedNode> | '*',
      ) => {
        let iterationResult = this.byPropertyValue(
          searchValue,
          properties,
          targetType,
          includeLocalResources,
          exactMatch,
          sanitized,
          subjects,
        );
        let iterationSubjects = iterationResult.getSubjects();

        //after added this results for this searchValue..
        //if this was the first iteration
        if (!subjects) {
          //then we will use the subjects of this loop to check against next iterations
          subjects = iterationSubjects;
          result = iterationResult;
        } else {
          //else we need to check if all the subjects from the first iteration ALSO occurred in this iteration
          subjects.forEach((subject) => {
            if (!iterationSubjects.has(subject)) {
              //if not, we retract results from that subject
              result = result.filter((quad) => {
                return quad.subject !== subject;
              });
            }
          });
        }
      },
    );
    return result;
  }

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
  static byPropertyValue(
    searchValue: string | NamedNode,
    properties: NodeSet<NamedNode> | NamedNode | '*' = '*',
    targetType?: NamedNode,
    includeLocalResources: boolean = true,
    exactMatch?: boolean,
    sanitized?: boolean,
    subjects?: NodeSet<NamedNode>,
  ): QuadSet {
    var result = new QuadSet();
    let propertySet: NodeSet<NamedNode>;
    if (properties instanceof NamedNode) {
      //if a propertyOrPropertyType TYPE was given (like ObjectProperty or IdProperty) then we look for ALL properties that are instances of this type
      if (
        properties.has(rdf.type, rdfs.Class) &&
        properties.has(rdfs.subClassOf, rdf.Property)
      ) {
        propertySet = properties.getAllInverse(rdf.type);
      } else {
        propertySet = new NodeSet([properties]);
      }
    } else if (properties == '*') {
      //by default use all properties
      propertySet = rdf.Property.getAllInverse(rdf.type);
    } else if (properties instanceof NodeSet) {
      propertySet = properties;
    } else {
      throw Error(
        "Invalid property given. Please provide a property, a property type, a set of properties or '*' to search for this value for any property",
      );
    }

    //go through all properties
    propertySet.forEach((searchProp) => {
      let potentialQuads: ICoreIterable<Quad>;

      //if we already have a set of subjects to test (from a previous result for example, see byPropertyValues)
      if (subjects) {
        //then we only have to look through the results of these subjects
        potentialQuads = subjects.getQuads(searchProp);
      } else {
        //if not, then we look through ALL LOCALLY KNOWN USAGES of this property
        potentialQuads = searchProp.getAsPredicateQuads();
      }
      if (!potentialQuads) return;

      //go through the quads for this property
      potentialQuads.forEach((quad) => {
        //option to exclude local nodes
        if (!includeLocalResources && quad.subject.isTemporaryNode) return;

        //option to only include subjects of a certain type
        if (targetType && !quad.subject.has(rdf.type, targetType)) return;

        if (searchValue instanceof NamedNode && quad.object === searchValue) {
          result.add(quad);
        }
        //if we find a value that matches the search string
        else if (
          this.valueMatches(
            quad.object,
            searchValue as string,
            sanitized,
            exactMatch,
          )
        ) {
          result.add(quad);
        }
      });
    });
    return result;
  }

  private static valueMatches(
    propertyValueResource: Node,
    value: string,
    sanitized: boolean,
    exactMatch: boolean,
  ): boolean {
    //if local nodes are allowed not allowed and the object is a local node, dont continue

    if (propertyValueResource instanceof NamedNode) return false;

    //get the value
    let propertyValue = propertyValueResource.value;

    if (sanitized) propertyValue = URI.sanitize(propertyValue);

    //not exact match? then we only test if the value starts with the identifier we're searching for
    if (!exactMatch) propertyValue = propertyValue.substr(0, value.length);

    //	if the value matches and the target type matches
    if (propertyValue === value) {
      return true;
    }
    return false;
  }
}
