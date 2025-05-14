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
import {List} from '../shapes/List.js';
import { getShapeClass } from './ShapeClass.js';
import { getNodeShapeUri } from './Package.js';

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
  datatype?: NamedNode;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeSet | Node[];
  /**
   * Value of the property must be boolean
   */
  editInline?: boolean;
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
   import {BlankNode,NamedNode,Literal} from "lincd/models";
   @linkedProperty({nodeKind:NamedNode})
   ```
   */
  nodeKind?: typeof Node | (typeof Node)[];

  /**
   * The shape that values of this property path need to confirm to.
   * You need to provide a class that extends Shape.
   * This is LINCDs equivalent of shacl:node
   */
  shape?: typeof Shape | [string,string];

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
   * should correlate to the given datatype or class
   * i.e. if class = foaf.Person you should provide a NamedNode with rdf.type foaf.Person or a Shape instance that has targetClass foaf.Person
   */
  defaultValue?: string | number | Node | Shape;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeSet | Node[];
  /**
   * Value of the property must be boolean
   */
  editInline?: boolean;
}

export interface ParameterConfig {
  optional?: number;
}

export const literalProperty = (config: LiteralPropertyShapeConfig) => {
  return _linkedProperty(config, shacl.Literal);
};
export const objectProperty = (config: ObjectPropertyShapeConfig) => {
  return _linkedProperty(config, shacl.IRI);
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

    //then we pass the shape, and it will be used to register the property shape
    let propertyShape = createPropertyShape(
      config,
      propertyKey,
      defaultNodeKind,
    );

    //once the NodeShape is available, we can add the property shape to it
    onShapeSetup(target.constructor, (shape: NodeShape) => {
      registerPropertyShape(shape, propertyShape);
    });
  };
};

export function registerPropertyShape(
  shape: NodeShape,
  propertyShape: PropertyShape,
) {
  let uri = `${shape.namedNode.uri}/${propertyShape.label}`;
  //with react hot reload, sometimes the same code gets loaded twice, recreating the same property shape
  //so if this URI already existed, we can ignore the new one, since its already registered
  if(!NamedNode.getNamedNode(uri))
  {
    //update the URI (by extending the URI of the shape)
    propertyShape.namedNode.uri = uri;

    //then add it directly
    shape.addPropertyShape(propertyShape);
  }
}
export function createPropertyShape(
  config: PropertyShapeConfig,
  propertyKey: string,
  defaultNodeKind: NamedNode = null,
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
  if (config['datatype']) {
    propertyShape.datatype = config['datatype'];
  }

  if (config.nodeKind) {
    let nodeKind = config.nodeKind;
    //for @linkedProperty, nodeKind will be Literal
    if (nodeKind === Literal) {
      propertyShape.nodeKind = shacl.Literal;
    }
    //for @objectProperty, by default nodeKind will be NamedNode
    // stored as shacl.IRI
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
    //once it's ready, we will use the NodeShape of this Shape class as the valueShape of this property shape
    onShapeSetup(config.shape, (nodeShape: NodeShape) => {
      propertyShape.valueShape = nodeShape;
    },propertyKey);
  }

  if (config.in) {
    //assuming config.in is a NodeSet already:
    propertyShape.inList = List.createFrom(config.in);
  }

  if (config.editInline) {
    propertyShape.editInline = config.editInline;
  }

  // console.log('Property method ' + config.path.toString() + ' initialised.');
  // if (!target.constructor.shape) {
  // 	console.log('Creating shape from method decorators.');
  // 	target.constructor.shape = new NodeShape();
  // }

  // //see above why shape may not be provided
  // if (shape) {
  //   //update the URI (by extending the URI of the shape)
  //   propertyShape.namedNode.uri = shape.namedNode.uri + `/${propertyKey}`;
  //
  //   //then add it directly
  //   shape.addPropertyShape(propertyShape);
  // }
  return propertyShape;

  //
  //sh.property
  //  (NamedNode value must have this type, like range but restrictive)
  //sh.class
  // (Literal value must have this datatype, like range)
  //sh.datatype
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
}
export function onShapeSetup(shapeClass: typeof Shape | [string,string], callback: (shape: NodeShape) => void,propertyName?:string) {
  //if a string was provided, then this is a "lazy loaded" shape, probably to avoid circular dependencies
  if(Array.isArray(shapeClass)) {
    const [packageName,shapeName] = shapeClass;
    const nodeShape = NamedNode.getOrCreate(getNodeShapeUri(packageName, shapeName));
    if(typeof document !== 'undefined') {
      //wait until the DOM is ready, which is when all modules are loaded
      window.addEventListener('load', () => {
        shapeClass = getShapeClass(nodeShape);
        if(!shapeClass) {
          console.warn(`Could not find value shape (${packageName}/${shapeName}) for accessor get ${propertyName}(). Likely because it is not bundled.`);
          return;
        }
        callback((shapeClass as typeof Shape).shape);
      })
    } else {
      //for node.js we can wait until the next tick, which is when all modules of THIS package are loaded (as long as they are loaded from index)
      setTimeout(() => {
        shapeClass = getShapeClass(nodeShape);
        callback((shapeClass as typeof Shape).shape);
      },0);
    }
  }
  if (shapeClass.hasOwnProperty('shape')) {
    callback((shapeClass as typeof Shape).shape);
  } else {
    if (!shapeClass['shapeCallbacks']) {
      shapeClass['shapeCallbacks'] = [];
    }
    shapeClass['shapeCallbacks'].push(callback);
  }
}