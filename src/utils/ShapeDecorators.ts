/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode, Literal, NamedNode, Node} from '../models.js';
import {Shape} from '../shapes/Shape.js';
import {NodeSet} from '../collections/NodeSet.js';
import {NodeShape, PropertyShape} from '../shapes/SHACL.js';
import {shacl} from '../ontologies/shacl.js';

export interface NodeShapeConfig {
  /**
   * Set to true to close the shape. This means any target node of this shape that has properties outside the defined properties of this shape is invalid.
   */
  closed?: boolean;
  /**
   * Optional list of properties that are also permitted in addition to those explicitly listed by this shape.
   */
  ignoredProperties: NodeSet<NamedNode>;
}

export interface LiteralPropertyShapeConfig extends PropertyShapeConfig {
  nodeKind?: typeof Literal;
  /**
   * Values of the configured property must be less than the values of this 'lessThan' property
   * Provide a NamedNode with rdf:type rdf:Property
   */
  lessThan?: NamedNode;
  /**
   * Values of the configured property must be less than or equal the values of this 'lessThan' property
   * Provide a NamedNode with rdf:type rdf:Property
   */
  lessThanOrEquals?: NamedNode;
  /**
   * All values of this property must be higher than this number
   */
  minExclusive?: number | string | Literal;
  /**
   * All values of this property must be higher than or equal this number
   */
  minInclusive?: number;
  /**
   * All values of this property must be lower than this number
   */
  maxExclusive?: number;
  /**
   * All values of this property must be lower than or equal this number
   */
  maxInclusive?: number;
  /**
   * All literal values of this property must at least be this long
   */
  minLength?: number;
  /**
   * All literal values of this property must at most be this long
   */
  maxLength?: number;
  /**
   * All literal values of this property must match this regular expression
   */
  pattern?: RegExp;
  /**
   * All literal values of this property must have one of these languages as their language tag
   */
  languageIn?: string[];
  /**
   * No pair of values may use the same language tag.
   */
  uniqueLang?: boolean;
  /**
   * Each literal value of this property must use this datatype
   */
  dataType?: NamedNode;
}

export interface ObjectPropertyShapeConfig extends PropertyShapeConfig {
  nodeKind?: typeof NamedNode | typeof BlankNode;
  /**
   * Each value of this property must have this class as its rdf:type
   */
  class?: NamedNode;
}

export interface PropertyShapeConfig {
  /**
   * The property path of this property shape.
   *
   * Currently, only 1 property is supported.
   *
   * Provide a NamedNode that has is a `rdf:Property`
   */
  path: NamedNode;

  /**
   * Indicates that this property must exist.
   * Shorthand for minCount=1
   */
  required?: boolean;

  /**
   Each value must be of this node type.

   Choose from NamedNode or BlankNode or Literal and provide the actual class as value

   @example
   ```tsx
   import {BlankNode,NamedNode,Literal} from "lincd/lib/models";
   @linkedProperty({nodeKind:NamedNode})
   ```
   */
  nodeKind?: typeof Node | (typeof Node)[];

  /**
   * The shape that values of this property path need to confirm to.
   * You need to provide a class that extends Shape.
   * This is LINCDs equivalent of shacl:node
   */
  shape?: typeof Shape;

  /**
   * Minimum number of values required
   */
  minCount?: number;
  /**
   * Maximum number of values allowed
   */
  maxCount?: number;
  /**
   * Values of the configured property must equal the values of this 'equals' property.
   * Provide a NamedNode with rdf:type rdf:Property
   */
  equals?: NamedNode;
  /**
   * Values of the configured property must differ from the values of this 'disjoint' property
   * Provide a NamedNode with rdf:type rdf:Property
   */
  disjoint?: NamedNode;
  /**
   * At least one value of this property must equal the given Node
   */
  hasValue?: Node;

  name?: string;
  description?: string;
  order?: number;
  group?: string;
  /**
   * should correlate to the given dataType or class
   * i.e. if class = foaf.Person you should provide a NamedNode with rdf.type foaf.Person or a Shape instance that has targetClass foaf.Person
   */
  defaultValue?: string | number | Node | Shape;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeSet;
}

export interface ParameterConfig {
  optional?: number;
}

export const literalProperty = (config: LiteralPropertyShapeConfig) => {
  return _linkedProperty(config, shacl.Literal);
};
export const objectProperty = (config: ObjectPropertyShapeConfig) => {
  return _linkedProperty(config);
};
/**
 * The most general decorator to indicate a get/set method requires & provides a certain linked data property.
 * Using this generator generates a [SHACL Property Shape](https://www.w3.org/TR/shacl/#property-shapes)
 * @param config - configures the property shape with a plain javascript object that follows the [PropertyShapeConfig](/docs/lincd.js/interfaces/utils_ShapeDecorators.PropertyShapeConfig) interface.
 *
 * @example
 * ```
 * \@linkedProperty({
 *   path:foaf.name,
 *   required:true,
 *   nodeKind:Literal,
 *   maxLength:1,
 *   defaultValue:"John"
 * })
 * get name(){
 *   return this.getValue(foaf.name) || "John"
 * }
 * ```
 */
export const linkedProperty = (config: PropertyShapeConfig) => {
  return _linkedProperty(config);
};
const _linkedProperty = (
  config: PropertyShapeConfig,
  defaultNodeKind: NamedNode = null,
) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    let propertyShape = new PropertyShape();
    propertyShape.path = config.path;
    propertyShape.label = propertyKey;

    if (config.required) {
      propertyShape.minCount = 1;
    } else if (config.minCount) {
      propertyShape.minCount = config.minCount;
    }

    if (config.maxCount) {
      propertyShape.maxCount = config.maxCount;
    }
    if (config['dataType']) {
      propertyShape.datatype = config['dataType'];
    }

    if (config.nodeKind) {
      let nodeKind = config.nodeKind;
      if (nodeKind === Literal) {
        propertyShape.nodeKind = shacl.Literal;
      }
      if (nodeKind === NamedNode) {
        propertyShape.nodeKind = shacl.IRI;
      }
      if (nodeKind === BlankNode) {
        propertyShape.nodeKind = shacl.BlankNode;
      }
      if (Array.isArray(nodeKind)) {
        if (nodeKind.includes(BlankNode) && nodeKind.includes(NamedNode)) {
          propertyShape.nodeKind = shacl.BlankNodeOrIRI;
        }
        if (nodeKind.includes(Literal) && nodeKind.includes(NamedNode)) {
          propertyShape.nodeKind = shacl.IRIOrLiteral;
        }
        if (nodeKind.includes(Literal) && nodeKind.includes(BlankNode)) {
          propertyShape.nodeKind = shacl.BlankNodeOrLiteral;
        }
      }
    } else {
      //if no nodeKind was provided, use the default, if given
      if (defaultNodeKind) {
        propertyShape.nodeKind = defaultNodeKind;
      }
    }
    //we accept a shape configuration, which translates to a sh:nodeShape
    if (config.shape) {
      //if this shape class has already got a NodeShape connected to it
      if (config.shape['shape']) {
        //then we can use this NodeShape now as the value of nodeShape for this property shape
        propertyShape.valueShape = config.shape['shape'];
      } else {
        //however the shape class may not have run its decorators yet
        //so in that case we temporarily store a reference
        //which gets processed in Module:linkedShape()
        if (!config.shape['nodeShapeOf']) {
          config.shape['nodeShapeOf'] = [];
        }
        config.shape['nodeShapeOf'].push(propertyShape);
      }
    }

    // console.log('Property method ' + config.path.toString() + ' initialised.');
    // if (!target.constructor.shape) {
    // 	console.log('Creating shape from method decorators.');
    // 	target.constructor.shape = new NodeShape();
    // }

    //if the shape has already been initiated (with linkedShape)
    //Note that the constructor may have shape defined if the class that it extends is already decorated with linkedShape
    //so we need to check hasOwnProperty
    let shape: NodeShape = target.constructor.hasOwnProperty('shape')
      ? target.constructor.shape
      : null;
    if (shape) {
      //update the URI (by extending the URI of the shape)
      propertyShape.namedNode.uri = shape.namedNode.uri + `/${propertyKey}`;

      //then add it directly
      shape.addPropertyShape(propertyShape);
    } else {
      //if not, then store property shapes in a temporary array in the constructor
      //this is picked up in Module.ts
      if (!target.constructor['propertyShapes']) {
        target.constructor['propertyShapes'] = [];
      }
      target.constructor['propertyShapes'].push(propertyShape);
    }

    // if(descriptor.get)
    // {
    //   descriptor.get['propertyShape'] = propertyShape;
    // }
    // if(descriptor.get)
    // {
    //   let original = descriptor.get;
    //   descriptor.get = () => {
    //
    //     return original();
    //   }
    // }
    // console.log(target, propertyKey, descriptor);

    //
    //sh.property
    //  (NamedNode value must have this type, like range but restrictive)
    //sh.class
    // (Literal value must have this datatype, like range)
    //sh.dataType
    //
    //sh.optional
    //
    //sh.path
    // (values must have this node type. Choose from:  sh:NodeKind: sh:BlankNode,sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral or sh:IRIOrLiteral)
    //sh.nodeKind
    // (cardinality, number, required properties would have minCount 1)
    //sh.minCount
    // (if only 1 value possible maxCount =1. Probably common)
    //sh.maxCount
    // (numbers)
    //sh.minExclusive
    //
    //sh.minInclusive
    //
    //sh.maxExclusive
    //
    //sh.maxInclusive
    // (must have exactly this value)
    //sh.hasValue
    // (specify possible values)
    //sh.in
    // (2 props must have different value)
    //sh.disjoin
    // (2 props must have same value)
    //sh.equals
  };
};
