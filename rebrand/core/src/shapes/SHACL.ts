/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode,Literal,NamedNode,Node} from '../models.js';
import {Shape} from './Shape.js';
import {shacl} from '../ontologies/shacl-named.js';
import {List} from './List.js';
import {xsd} from '../ontologies/xsd-named.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {NodeSet} from '../collections/NodeSet.js';
import {rdf} from '../ontologies/rdf-named.js';
import {CoreMap} from '../collections/CoreMap.js';
import {ForwardReasoning} from '../utils/ForwardReasoning.js';
import {getShapeClass,getShapeOrSubShape} from '../utils/ShapeClass.js';
import {ShapeValuesSet} from '../collections/ShapeValuesSet.js';
import {rdfs} from '../ontologies/rdfs-named.js';
import {lincd} from '../ontologies/lincd-named.js';
import { URI } from '../utils/URI.js';
import {NodeReferenceValue,toNamedNode,toNodeReference} from '../utils/NodeReference.js';

export const LINCD_DATA_ROOT: string = 'https://data.lincd.org/';

type PropertyPathInput = string | NodeReferenceValue;
type PropertyPathInputList = PropertyPathInput | PropertyPathInput[];

const normalizePathInput = (
  value: PropertyPathInputList,
): NodeReferenceValue[] => {
  const entries = Array.isArray(value) ? value : [value];
  return entries.map((entry) => toNodeReference(entry));
};

const normalizeNamedNodePath = (
  value: PropertyPathInputList,
): NamedNode[] => {
  return normalizePathInput(value).map((entry) => toNamedNode(entry));
};

export class SHACL_Shape extends Shape
{
  static targetClass: NamedNode = shacl.Shape;
  static validating: Set<string> = new Set();

  get type()
  {
    return this.getOne(rdf.type) as NamedNode;
  }

  set type(val: NamedNode)
  {
    this.overwrite(rdf.type,val);
  }

  protected _validateNode(
    node: NamedNode,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean>(),
  ): boolean
  {
    return false;
  }
}

//Note: this shape is linked in Module.ts to avoid cyclical dependencies
export class NodeShape extends SHACL_Shape
{
  static targetClass: NamedNode = shacl.NodeShape;
  private static _instances: ShapeSet<NodeShape>;

  /**
   * Because (currently) all NodeShapes are initialized immediately upon initialisation
   * We can cache the instances of NodeShapes to speed up frequent methods used in Storage
   */
  static get instances()
  {
    if (!this._instances)
    {
      this._instances = this.getLocalInstancesByType();
    }
    return this._instances;
  }

  get targetNode(): NamedNode
  {
    return this.getOne(shacl.targetNode) as NamedNode;
  }

  set targetNode(value)
  {
    this.overwrite(shacl.targetNode,value);
  }

  get targetClass(): NamedNode
  {
    return this.getOne(shacl.targetClass) as NamedNode;
  }

  set targetClass(value: NamedNode | NodeReferenceValue | string)
  {
    this.overwrite(shacl.targetClass, toNamedNode(value));
  }

  get properties()
  {
    return this.getPropertyShapes(false);
  }

  get extends(): NodeShape
  {
    return this.getOneAs(lincd.isExtending,NodeShape);
  }

  set extends(value: NodeShape)
  {
    this.overwrite(lincd.isExtending,value.node);
  }

    /**
   * A human-readable description for this shape
   */
    get description()
    {
      return this.getValue(rdfs.comment);
    }
  
    set description(val: string) {
      if (val.length > 220) {
        throw Error(
          `Shape descriptions should stay under 220 characters. ${this.label}.description is ${val.length} chars.`,
        );
      }
      this.overwrite(rdfs.comment, new Literal(val));
    }

  static getShapesOf(node: Node)
  {
    return this.getLocalInstances().filter((shape) => {
      return shape.validateNode(node);
    });
  }

  addPropertyShape(property: PropertyShape)
  {
    this.set(shacl.property,property.namedNode);
  }

  getPropertyShapes(includeSuperClasses: boolean = false): ShapeSet<PropertyShape>
  {
    let res: NodeSet;
    if (includeSuperClasses)
    {
      res = new NodeSet();
      let shapeClass = getShapeClass(this.namedNode).prototype;
      while (shapeClass && shapeClass.nodeShape)
      {
        shapeClass.nodeShape.getAll(shacl.property).forEach(res.add.bind(res));
        shapeClass = Object.getPrototypeOf(shapeClass);
      }
    }
    else
    {
      res = this.getAll(shacl.property);
    }
    return PropertyShape.getSetOf(res);
  }

  getPropertyShape(label: string,checkSubShapes: boolean = true): PropertyShape
  {
    let shapeClass = getShapeClass(this.namedNode)
    let res;
    while (!res && shapeClass)
    {
      res = shapeClass.shape.getPropertyShapes().find((shape) => shape.label === label);
      if(checkSubShapes) {
        //if even Shape didn't have it, then we're done, it's not found.
        if(shapeClass === Shape) {
          break;
        }
        //next, use the super class
        shapeClass = Object.getPrototypeOf(shapeClass);
      } else {
        break;
      }
    }
    return res;
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode>
  {
    let entities = new NodeSet<NamedNode>();
    if (this.targetClass)
    {
      entities.add(this.targetClass);
    }
    //add ontology entities of all property shapes
    this.getPropertyShapes().forEach((propertyShape) => {
      entities = entities.concat(propertyShape.getOntologyEntities());
    });
    return entities;
  }

  validateNode(node: Node): boolean
  {
    return this._validateNode(node);
  }

  validateNodeByType(node: Node): boolean
  {
    return node.has(rdf.type,this.targetClass);
  }

  protected _validateNode(
    node: Node,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean | null>(),
  ): boolean
  {
    if (validated.has(node))
    {
      return validated.get(node);
    }
    
    // Global circular validation prevention
    const validationKey = `${node.toString()}-${this.uri}`;
    if (SHACL_Shape.validating.has(validationKey)) {
      return true; // Assume valid to break circular reference
    }
    
    // Add this validation to the tracking set
    SHACL_Shape.validating.add(validationKey);
    
    try {
      //whilst validating, if a connected node wants to validate THIS node, we consider this node to be valid until proven otherwise below
      validated.set(node,true);

    //EDIT: targetClass is just for selecting nodes. It's not an enforcement, for that shacl:class should be used.
    // if (this.targetClass) {
    //   //NOTE, we're using Reasoning to check types, so that if this node has a type which is a subClassOf the targetClass, it still matches.
    //   //this would not be needed if a Forwards reasoning engine was in place
    //   if (
    //     !(
    //       node instanceof NamedNode &&
    //       ForwardReasoning.hasType(node, this.targetClass)
    //     )
    //   ) {
    //     validated.set(node, false);
    //     return false;
    //   }
    // }
    const propertyShapes = this.getPropertyShapes();
    if (propertyShapes.size > 0)
    {
      if (node instanceof Literal)
      {
        validated.set(node,false);
        return false;
      }
      else if (node instanceof NamedNode)
      {
        if (
          !this.getPropertyShapes().every((propertyShape) => {
            return (propertyShape as any)._validateNode(node,validated);
          })
        )
        {
          validated.set(node,false);
          return false;
        }
      }
    }
    // validated.set(node,true);
    return true;
    } finally {
      // Always clean up the validation tracking
      SHACL_Shape.validating.delete(validationKey);
    }
  }
}

//Note: this shape is linked in Module.ts to avoid cyclical dependencies
export class PropertyShape extends SHACL_Shape
{
  static targetClass: NamedNode = shacl.PropertyShape;

  get class(): NamedNode
  {
    return this.getOne(shacl.class) as NamedNode;
  }

  set class(value: NamedNode | NodeReferenceValue | string)
  {
    this.overwrite(shacl.class, toNamedNode(value));
  }

  /**
   * Returns the NodeShape that all value nodes need to conform to
   * On a graph level this accessor returns the value of shacl:node for this PropertyShape (if any)
   * Note: it's named valueShape because node & nodeShape are already used internally in LINCD
   * @see https://www.w3.org/TR/shacl/#NodeConstraintComponent
   *
   */
  //@NOTE: If the name valueShape is an issue we could always rename `get nodeShape` to `get shaclShape` in Shape.ts
  get valueShape(): NodeShape
  {
    return this.hasProperty(shacl.node) ? new NodeShape(this.getOne(shacl.node)) : null;
  }

  set valueShape(value: NodeShape | NamedNode)
  {
    // Accept either a NodeShape instance or a NamedNode (URI) directly
    // This allows setting the valueShape without needing to resolve to a Shape class
    // TODO: review types maybe only accept NodeShape
    const nodeToSet = value instanceof NodeShape ? value.node : value;
    this.overwrite(shacl.node, nodeToSet);
  }

  get nodeKind(): NamedNode
  {
    return this.getOne(shacl.nodeKind) as NamedNode;
  }

  set nodeKind(value: NamedNode | NodeReferenceValue | string)
  {
    this.overwrite(shacl.nodeKind, toNamedNode(value));
  }

  get datatype(): NamedNode
  {
    return this.getOne(shacl.datatype) as NamedNode;
  }

  set datatype(value: NamedNode | NodeReferenceValue | string)
  {
    this.overwrite(shacl.datatype, toNamedNode(value));
  }

  get maxCount(): number
  {
    return parseInt(this.getValue(shacl.maxCount));
  }

  set maxCount(value: number)
  {
    this.overwrite(shacl.maxCount,new Literal(value.toString(),xsd.integer));
  }

  get minCount(): number
  {
    return parseInt(this.getValue(shacl.minCount));
  }

  set minCount(value: number)
  {
    this.overwrite(shacl.minCount,new Literal(value.toString(),xsd.integer));
  }

  get name(): string
  {
    return this.getValue(shacl.name);
  }

  // Setter overloading - would be nice to have one for String and another for Literal:
  // https://github.com/microsoft/TypeScript/issues/2521
  set name(value: string)
  {
    this.overwrite(shacl.name,new Literal(value));
  }

  get description(): string
  {
    return this.getValue(shacl.description);
  }

  set description(value: string)
  {
    this.overwrite(shacl.description,new Literal(value));
  }

  get path(): NodeReferenceValue | NodeReferenceValue[]
  {
    const propertyPath = this.getAll(shacl.path);
    const refs = [...propertyPath].map((node) => toNodeReference(node.id));
    return refs.length === 1 ? refs[0] : refs;
  }

  set path(value: PropertyPathInputList)
  {
    const namedNodes = normalizeNamedNodePath(value);
    if (namedNodes.length === 1)
    {
      this.overwrite(shacl.path, namedNodes[0]);
    }
    else
    {
      this.moverwrite(shacl.path, namedNodes);
    }
  }

  //@TODO: property decorators should support properties that hold List values
  // Queries should return arrays for these type of values
  get in(): NamedNode
  {
    return this.getOne(shacl.in) as NamedNode;
  }

  set in(value: NamedNode)
  {
    this.overwrite(shacl.in,value);
  }

  get inList(): List
  {
    return this.hasProperty(shacl.in)
      ? List.getOf(this.getOne(shacl.in))
      : null;
  }

  set inList(value: List)
  {
    this.overwrite(shacl.in,value.node);
  }

  get parentNodeShape(): NodeShape
  {
    return this.hasInverseProperty(shacl.property)
      ? new NodeShape(this.getOneInverse(shacl.property))
      : null;
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode>
  {
    const pathValue = this.path;
    const pathNodes = (Array.isArray(pathValue) ? pathValue : [pathValue]).map(
      (path) => toNamedNode(path),
    );
    //start with values of those properties that have a NamedNode as value
    const entities = new NodeSet<NamedNode>(
      [this.class,...pathNodes,this.datatype].filter((value) => value && true),
    );
    //this caused loops!
    // if (this.nodeShape) {
    //if a node shape is defined, also add all the entities of that node shape
    // entities = entities.concat(this.nodeShape.getOntologyEntities());
    // }
    return entities;
  }

  validateNode(node: NamedNode): boolean
  {
    return this._validateNode(node);
  }

  resolveFor(node: NamedNode)
  {
    //TODO: support more complex property paths
    const pathValue = this.path;
    const pathEntries = Array.isArray(pathValue) ? pathValue : [pathValue];
    let target: NamedNode | NodeSet = node;
    for (const prop of pathEntries)
    {
      target = target.getAll(toNamedNode(prop));
    }
    return target;
  }

  protected _validateNode(
    node: NamedNode,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean>(),
  ): boolean
  {
    // Global circular validation prevention
    const validationKey = `${node.uri}__${this.uri}`;
    if (SHACL_Shape.validating.has(validationKey)) {
      return true; // Assume valid to break circular reference
    }
    
    // Add this validation to the tracking set
    SHACL_Shape.validating.add(validationKey);
    
    try {
      const pathValue = this.path;
    const pathEntries = Array.isArray(pathValue) ? pathValue : [pathValue];
    let target: NamedNode | NodeSet = node;
    for (const prop of pathEntries)
    {
      target = target.getAll(toNamedNode(prop));
    }
    const values = target as NodeSet;
    //validate shacl:class
    if (this.class)
    {
      if (
        !values.every(
          (value) =>
            value instanceof NamedNode && value.has(rdf.type,this.class),
        )
      )
      {
        return false;
      }
    }
    //validate shacl:datatype
    if (this.datatype)
    {
      if (
        !values.every(
          (value) =>
            value instanceof Literal && value.datatype === this.datatype,
        )
      )
      {
        return false;
      }
    }
    //validate shacl:node
    if (this.valueShape)
    {
      //every value should be a valid instance of this nodeShape
      const nodeShape = this.valueShape;
      if (
        !values.every((value) => {
          //nodes referring to each other or to themselves may cause loops here
          //this is currently avoided by keeping track of which nodes have already been validated, during the validation of the root most node
          //TODO: perhaps at some point we may want to store validation results in the shape or even the node, and invalidate whenever the node changes any of its properties. (though for complex property paths that would mean more complex invalidation as well. i.e. back tracing property shapes on a change in node 1 to invalidate a distant node 2)
          if (validated.has(value))
          {
            return validated.get(value);
          }
          
          return (
            (value === node && this.parentNodeShape.equals(nodeShape)) ||
            (nodeShape as any)._validateNode(value,validated)
          );
        })
      )
      {
        return false;
      }
    }
    //validate shacl:minCount
    if (this.minCount)
    {
      if (values.size < this.minCount)
      {
        return false;
      }
    }
    //validate shacl:maxCount
    if (this.maxCount)
    {
      if (values.size > this.maxCount)
      {
        return false;
      }
    }
    return true;
    } finally {
      // Always clean up the validation tracking
      SHACL_Shape.validating.delete(validationKey);
    }
  }
}

// ============================================================================
// Shape Decorators - moved from utils/ShapeDecorators.ts to eliminate circular dependency
// ============================================================================

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
  datatype?: NodeReferenceValue | string;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeSet | Node[];
}

export interface ObjectPropertyShapeConfig extends PropertyShapeConfig {
  nodeKind?: typeof NamedNode | typeof BlankNode;
  /**
   * Each value of this property must have this class as its rdf:type
   */
  class?: NodeReferenceValue | string;
  /**
   * The shape that values of this property path need to confirm to.
   * You need to provide a class that extends Shape.
   * This is LINCDs equivalent of shacl:node
   */
  shape?: typeof Shape | [string, string];
}

export interface PropertyShapeConfig {
  /**
   * The property path of this property shape.
   *
   * Currently, only 1 property is supported.
   *
   * Provide a NamedNode that has is a `rdf:Property`
   */
  path: PropertyPathInputList;

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
  equals?: NodeReferenceValue | string;
  /**
   * Values of the configured property must differ from the values of this 'disjoint' property
   * Provide a NamedNode with rdf:type rdf:Property
   */
  disjoint?: NodeReferenceValue | string;
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
  defaultValue?: string | number | Node | Shape | NodeReferenceValue;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeSet | Node[];

  /**
   * Values of the configured property path are sorted by the values of this property path.
   */
  sortBy?: PropertyPathInputList;
}

export interface ParameterConfig {
  optional?: number;
}

function connectValueShape<
  Config extends LiteralPropertyShapeConfig | ObjectPropertyShapeConfig,
>(config:Config,propertyKey:string, property:PropertyShape) {
  //we accept a shape configuration, which translates to a sh:nodeShape
  if ((config as ObjectPropertyShapeConfig).shape) {
    const shapeConfig = (config as ObjectPropertyShapeConfig).shape;
    
    // If shape is a tuple like ['lincd-schema', 'ImageObject'], use the URI directly
    // without waiting for the Shape class to be ready
    if (Array.isArray(shapeConfig)) {
      const [packageName, shapeName] = shapeConfig;
      // Get the NodeShape URI directly using getNodeShapeUri
      const nodeShapeUri = getNodeShapeUri(packageName, shapeName);
      // Create or get the NamedNode with this URI
      const nodeShapeNode = NamedNode.getOrCreate(nodeShapeUri);
      // Set the valueShape to the NamedNode (URI) directly
      // No need to wait for the Shape class to be ready
      property.valueShape = nodeShapeNode;
    } else {
      // If shape is a Shape class (typeof Shape), check if it already has a NodeShape
      // If yes, we can use the NodeShape URI directly without waiting
      const shapeClass = shapeConfig as typeof Shape;
      if (shapeClass.shape) {
        // The Shape class already has its NodeShape set up
        // Use the NodeShape NamedNode (URI) directly
        // This avoids circular dependencies (e.g., Person.knows: Person)
        property.valueShape = shapeClass.shape.namedNode;
      } else {
        // The Shape class doesn't have its NodeShape yet
        // Wait for it to be set up using the old behavior
        onShapeSetup(
          shapeConfig,
          (nodeShape: NodeShape) => {
            //Thing.image -> ImageObject
            //we wait for Thing to be ready so we can connect the image PropertyShape
            //THEN, we connect imagePropertyShape to the nodeShape of ImageObject
            //so here we get nodeShape = schema/shapes/ImageObject
            // console.log(`Setting ${property.uri} (${property.label}) value shape to ${nodeShape.namedNode.uri}`);
            property.valueShape = nodeShape;
          },
          propertyKey,
        );
      }
    }
  }
}

export function registerPropertyShape(
  shape: NodeShape,
  propertyShape: PropertyShape,
) {
  let uri = `${shape.namedNode.uri}/${propertyShape.label}`;
  //with react hot reload, sometimes the same code gets loaded twice, recreating the same property shape
  //so if this URI already existed, we can ignore the new one, since its already registered
  if (!NamedNode.getNamedNode(uri)) {
    //update the URI (by extending the URI of the shape)
    propertyShape.namedNode.uri = uri;

    //then add it directly
    shape.addPropertyShape(propertyShape);
  } else {
    //this also happens when the shape is already in storage. in this case we should copy over all the properties
    let existing = NamedNode.getNamedNode(uri);
    propertyShape.namedNode.getProperties().forEach((prop) => {
      existing.moverwrite(prop, propertyShape.namedNode.getAll(prop));
    });
    // console.log('Updated shape:',existing.print());
  }
}

export function createPropertyShape<
  Config extends LiteralPropertyShapeConfig | ObjectPropertyShapeConfig,
>(config: Config, propertyKey: string, defaultNodeKind: NamedNode = null, shapeClass: typeof Shape | [string, string] = null) {
  let propertyShape = new PropertyShape();
  propertyShape.path = config.path;
  propertyShape.label = propertyKey;

  if (config.name) {
    propertyShape.name = config.name;
  }
  if (config.description) {
    propertyShape.description = config.description;
  }

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

  if (config.in) {
    //assuming config.in is a NodeSet already:
    propertyShape.inList = List.createFrom(config.in);
  }

  //once the NodeShape is available, we can add the property shape to it
  if(shapeClass) {
    onShapeSetup(shapeClass, (shape: NodeShape) => {
      // Connect the value shape BEFORE registering the property shape
      // This ensures the valueShape is set on the propertyShape before it gets registered
      connectValueShape(config,propertyKey,propertyShape);
      registerPropertyShape(shape, propertyShape);
    });
  }

  return propertyShape;
}

export function onShapeSetup(
  shapeClass: typeof Shape | [string, string],
  callback: (shape: NodeShape) => void,
  propertyName?: string,
  waitForSuperShapes?: boolean,
) {
  const cb = waitForSuperShapes ? (shape: NodeShape) => {
    const superClass = Object.getPrototypeOf(shapeClass) as typeof Shape;
    if(superClass.name === 'Shape') {
      callback(shape);
      return;
    }
    //make sure every linked shape extends Shape
    if(superClass.name === '') {
      console.error(`Shape ${shape.label} does not extend base class lincd/shapes/Shape. Make sure it extends Shape.`);
      return;
    }
    onShapeSetup(superClass, (superNodeShape: NodeShape) => {
      callback(shape);
    },propertyName,waitForSuperShapes);
  } : callback;

  const safeCallback = (shapeClass: typeof Shape, cb: (shape: NodeShape) => void) => {
    if (shapeClass.hasOwnProperty('shape')) {
      cb((shapeClass as typeof Shape).shape);
    } else {
      if (!shapeClass['shapeCallbacks']) {
        shapeClass['shapeCallbacks'] = [];
      }
      shapeClass['shapeCallbacks'].push(cb);
    }
  }

  //if a string was provided, then this is a "lazy loaded" shape, probably to avoid circular dependencies
  if (Array.isArray(shapeClass)) {
    const [packageName, shapeName] = shapeClass;
    const nodeShape = NamedNode.getOrCreate(
      getNodeShapeUri(packageName, shapeName),
    );
    //in the browser/DOM
    if (typeof document !== 'undefined') {
      //wait until the DOM is ready, which is when all modules are loaded
      window.addEventListener('load', () => {
        shapeClass = getShapeClass(nodeShape);
        if (!shapeClass) {
          console.warn(
            `Could not find value shape (${packageName}/${shapeName}) for accessor get ${propertyName}(). Likely because it is not bundled.`,
          );
          return;
        }
        safeCallback(shapeClass, cb);
      });
    } else {
      //for node.js we can wait until the next tick, which is when all modules of THIS package are loaded (as long as they are loaded from index)
      addNodeShapeCallback(nodeShape,cb);
    }
  } else {
    safeCallback(shapeClass, cb);
  }
}

const _linkedProperty = <
  Config extends ObjectPropertyShapeConfig | LiteralPropertyShapeConfig,
>(
  config: Config,
  defaultNodeKind: NamedNode = null,
) => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    createPropertyShape(
      config,
      propertyKey,
      defaultNodeKind,
      target.constructor,
    )
  };
};

export const literalProperty = (config: LiteralPropertyShapeConfig) => {
  return _linkedProperty<LiteralPropertyShapeConfig>(config, shacl.Literal);
};

export const objectProperty = (config: ObjectPropertyShapeConfig) => {
  return _linkedProperty<ObjectPropertyShapeConfig>(config, shacl.IRI);
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
export const linkedProperty = (
  config: ObjectPropertyShapeConfig | LiteralPropertyShapeConfig,
) => {
  return _linkedProperty(config);
};

export function disallowProperty(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  //implicitly expects there to be a property with the same name in a super class.
  // and this newly created extends (for now clones) the super class property shape.

  //once the NodeShape is available, we can add the property shape to it
  onShapeSetup(target.constructor, (shape: NodeShape) => {

    //get the super class shape
    const superClass = Object.getPrototypeOf(target.constructor) as typeof Shape;
    const superNodeShape = superClass.shape;
      //find the property shape in the super class shape
      const superPropertyShape = superNodeShape.getPropertyShape(propertyKey,true);
      if(!superPropertyShape) {
        console.warn(`Property ${propertyKey} not found in super class ${superClass.name} or any of its super classes. Does it have a property decorator? Cannot disallow property ${target.constructor.name}.${propertyKey}`);
        return;
      }
      //clone it and set the maxCount to 0
      const clonedPropertyShape = superPropertyShape.clone();
      clonedPropertyShape.maxCount = 0;
      registerPropertyShape(shape, clonedPropertyShape);
  },'',true);
}

// ============================================================================
// End of Shape Decorators
// ============================================================================

export class ValidationResult extends Shape
{
  static targetClass: NamedNode = shacl.ValidationResult;

  @objectProperty({
    path: shacl.focusNode,
    maxCount: 1,
  })
  get focusNode(): Node
  {
    return this.getOne(shacl.focusNode) as Node;
  }

  set focusNode(value: Node)
  {
    this.overwrite(shacl.focusNode,value);
  }

  @objectProperty({
    path: shacl.sourceShape,
    maxCount: 1,
  })
  get sourceShape(): SHACL_Shape
  {
    return getShapeOrSubShape(this.getOne(shacl.sourceShape),SHACL_Shape);
  }

  set sourceShape(value: SHACL_Shape)
  {
    this.overwrite(shacl.sourceShape,value.node);
  }

  @objectProperty({
    path: shacl.resultSeverity,
    maxCount: 1,
  })
  get resultSeverity(): NamedNode
  {
    return this.getOne(shacl.resultSeverity) as NamedNode;
  }

  set resultSeverity(value: NamedNode)
  {
    this.overwrite(shacl.resultSeverity,value);
  }

  @objectProperty({
    path: shacl.resultPath,
    maxCount: 1,
  })
  get resultPath(): NodeReferenceValue | NodeReferenceValue[]
  {
    const propertyPath = this.getAll(shacl.resultPath);
    const refs = [...propertyPath].map((node) => toNodeReference(node.id));
    return refs.length === 1 ? refs[0] : refs;
  }

  set resultPath(value: PropertyPathInputList)
  {
    const namedNodes = normalizeNamedNodePath(value);
    if (namedNodes.length === 1)
    {
      this.overwrite(shacl.resultPath,namedNodes[0]);
    }
    else
    {
      this.moverwrite(shacl.resultPath,namedNodes);
    }
  }

  @objectProperty({
    path: shacl.value,
    maxCount: 1,
  })
  get validatedValue(): Node
  {
    return this.getOne(shacl.value);
  }

  set validatedValue(value: Node)
  {
    this.overwrite(shacl.value,value);
  }

  @literalProperty({
    path: shacl.message,
    maxCount: 1,
  })
  get message(): string
  {
    return this.getOne(shacl.message).value;
  }

  set message(value: string)
  {
    this.overwrite(shacl.message,new Literal(value));
  }

  get sourceConstraintComponent(): NamedNode
  {
    return this.getOne(shacl.sourceConstraintComponent) as NamedNode;
  }

  set sourceConstraintComponent(value: NamedNode)
  {
    this.overwrite(shacl.sourceConstraintComponent,value);
  }

  static createForNodeAgainstPropertyShape(
    focusNode: NamedNode,
    propertyShape: PropertyShape,
  )
  {
    let validationResult = new ValidationResult();
    validationResult.focusNode = focusNode;
    validationResult.sourceShape = propertyShape;
    validationResult.resultSeverity = shacl.Violation;
    validationResult.resultPath = propertyShape.path;

    const pathValue = propertyShape.path;
    const pathEntries = Array.isArray(pathValue) ? pathValue : [pathValue];
    let values: NodeSet | NamedNode | null = focusNode;
    if (pathEntries.length === 0)
    {
      values = new NodeSet();
    }
    else
    {
      for (const prop of pathEntries)
      {
        values = values.getAll(toNamedNode(prop));
      }
    }
    const valuesSet = (values || new NodeSet()) as NodeSet;
    for (let value of valuesSet)
    {
      //validate shacl:class
      if (propertyShape.class)
      {
        if (
          !(
            value instanceof NamedNode &&
            value.has(rdf.type,propertyShape.class)
          )
        )
        {
          validationResult.validatedValue = value;
          validationResult.message = `Value does not have the required class ${propertyShape.class.uri}`;
          validationResult.sourceConstraintComponent =
            shacl.ClassConstraintComponent;
          return validationResult;
        }
      }
      //validate shacl:datatype
      if (propertyShape.datatype)
      {
        if (
          !(
            value instanceof Literal &&
            value.datatype === propertyShape.datatype
          )
        )
        {
          validationResult.validatedValue = value;
          validationResult.message = `Value does not have the required datatype ${propertyShape.datatype.uri}`;
          validationResult.sourceConstraintComponent =
            shacl.DatatypeConstraintComponent;
          return validationResult;
        }
      }
      //validate shacl:node
      if (propertyShape.valueShape)
      {
        //every value should be a valid instance of propertyShape nodeShape
        let nodeShape = propertyShape.valueShape;
        //TODO: / NOTE: for validation else where in this file we save validation results to avoid infinite loops
        // we don't do that yet here, so we may get loops when shapes refer to each other
        let valueIsSelf = value === focusNode && propertyShape.parentNodeShape.equals(nodeShape);
        if (
          !valueIsSelf && !(nodeShape as any)._validateNode(value)
        )
        {
          //get extra information why the value doesn't match the shape
          let valueReport = ValidationReport.forNodeAgainstShape(value,nodeShape);

          validationResult.sourceConstraintComponent =
            shacl.NodeConstraintComponent;
          validationResult.validatedValue = value;
          validationResult.message = `Value does not conform to the required shape ${propertyShape.valueShape.uri}:\n\t${valueReport.toString().replace(/\n/g,'\n\t')}`;
          return validationResult;
        }
      }
    }
    //validate shacl:minCount
    if (propertyShape.minCount)
    {
      if (valuesSet.size < propertyShape.minCount)
      {
        validationResult.message = `Minimum ${
          propertyShape.minCount
        } values required for ${propertyShape.path.toString()}. But only ${
          valuesSet.size
        } values were found`;
        validationResult.sourceConstraintComponent =
          shacl.MinLengthConstraintComponent;
        return validationResult;
      }
    }
    //validate shacl:maxCount
    if (propertyShape.maxCount)
    {
      if (valuesSet.size > propertyShape.maxCount)
      {
        validationResult.message = `Maximum ${
          propertyShape.maxCount
        } values allowed for  ${propertyShape.path.toString()}. But ${
          valuesSet.size
        } values were found`;
        validationResult.sourceConstraintComponent =
          shacl.MaxLengthConstraintComponent;
        return validationResult;
      }
    }
    return null;
  }

  toString(): string
  {
    let result = '';
    // if(this.sourceShape) {
    //   result += '\tSource Shape:\t'+this.sourceShape.uri + '\n';
    // }
    let resultPathStr = '';
    let resultPath = this.resultPath;
    if (resultPath)
    {
      const resultPathEntries = Array.isArray(resultPath)
        ? resultPath
        : [resultPath];
      resultPathStr = resultPathEntries.map((path) => path.id).join(' -> ');
    }
    if (this.focusNode)
    {
      result += '\tFocus Node:\t' + this.focusNode.toString() + '\n';
    }
    if (this.resultPath)
    {
      result += '\tPath:\t\t' + resultPathStr + '\n';
    }
    if (this.validatedValue)
    {
      result += '\tValue:\t' + this.validatedValue.toString() + '\n';
    }
    if (this.sourceConstraintComponent)
    {
      result += '\tConstraint:\t' + this.sourceConstraintComponent.id + '\n';
    }
    if (this.message)
    {
      result += '\tMessage:\t' + this.message + '\n';
    }
    if (this.resultSeverity)
    {
      result += '\tSeverity:\t' + this.resultSeverity.id + '\n';
    }
    return result;
  }
}

export class ValidationReport extends Shape
{
  static targetClass: NamedNode = shacl.ValidationReport;
  static validating: CoreMap<string,ValidationReport> = new CoreMap<string,ValidationReport>();

  @literalProperty({
    path: shacl.conforms,
    datatype: xsd.boolean,
  })
  get conforms(): boolean
  {
    return this.getValue(shacl.conforms) === 'true';
  }

  set conforms(val: boolean)
  {
    this.overwrite(shacl.conforms,new Literal(val ? 'true' : 'false',xsd.boolean));
  }

  @objectProperty({
    path: shacl.result,
    shape: ValidationResult,
  })
  get validationResults(): ShapeValuesSet<ValidationResult>
  {
    return ValidationResult.getSetOf(
      this.getAll(shacl.result),
    ) as ShapeValuesSet<ValidationResult>;
  }

  /**
   * From the SHACL spec: https://www.w3.org/TR/shacl/#validation-definition
   * Validation of a focus node against a shape: Given a focus node in the data graph and a shape in the shapes graph, the validation results are the union of the results of the validation of the focus node against all constraints declared by the shape, unless the shape has been deactivated, in which case the validation results are empty.
   * @param focusNode
   * @param shape
   */
  static forNodeAgainstShape(
    focusNode: Node,
    shape: NodeShape,
  ): ValidationReport
  {
    const validationKey = `${focusNode.value}__${shape.uri}`;
    if (ValidationReport.validating.has(validationKey)) {
      return ValidationReport.validating.get(validationKey);
    }
    
    ValidationReport.validating.set(validationKey,new ValidationReport());
    try {
      let report = new ValidationReport();
      report.conforms = shape.validateNode(focusNode);
      if (shape.targetClass)
      {
        //NOTE, we're using Reasoning to check types, so that if this node has a type which is a subClassOf the targetClass, it still matches.
        //this would not be needed if a Forwards reasoning engine was in place
        if (
          !(
            focusNode instanceof NamedNode &&
            ForwardReasoning.hasType(focusNode,shape.targetClass)
          )
        )
        {
          // let validationResult = new ValidationResult();
          // validationResult.focusNode = focusNode;
          // validationResult.sourceShape = shape;
          // validationResult.message = `Value does not have the required class ${propertyShape.class.uri}`;
          // validationResult.sourceConstraintComponent = shacl.ClassConstraintComponent;
          // report.validationResults.add(validationResult);
          console.log(
            `${focusNode.toString()} does not have target type: ${
              shape.targetClass.uri
            }. Although it's not a SHACL validation error, it does mean this node will not be selected when getting instances of the ${
              shape.label
            } shape.}`,
          );
        }
      }
      if (report.conforms)
      {
        return report;
      }

      let propertyShapes = shape.getPropertyShapes();
      if (propertyShapes.size > 0)
      {
        if (focusNode instanceof Literal)
        {
          //literals can not match NodeShapes (?)
          //TODO: this is not fully standard compliant? for now we do a custom message to match the way LINCD does it
          let validationResult = new ValidationResult();
          validationResult.focusNode = focusNode;
          validationResult.sourceShape = shape;
          validationResult.message =
            'A literal currently cannot be a valid instance of a NodeShape.';
          report.validationResults.add(validationResult);
          // return false;
        }
        else if (focusNode instanceof NamedNode)
        {
          propertyShapes.forEach((propertyShape) => {
            let validationResult =
              ValidationResult.createForNodeAgainstPropertyShape(
                focusNode,
                propertyShape,
              );
            if (validationResult)
            {
              report.validationResults.add(validationResult);
            }
          });
        }
      }
      return report;
    } finally {
      ValidationReport.validating.delete(validationKey);
    }
  }

  static printForShapeInstances(shape: typeof Shape)
  {
    const targetClass = shape.targetClass ? toNamedNode(shape.targetClass) : null;
    if (!targetClass)
    {
      console.log(`Shape ${shape.name} does not define a targetClass.`);
      return;
    }
    let potentialNodes = targetClass.getAllInverse(rdf.type);
    console.log(
      'Checking ' +
      potentialNodes.size +
      ' instances of ' +
      targetClass.id,
    );
    let allConfirm = true;
    potentialNodes.forEach((node) => {
      let report = ValidationReport.forNodeAgainstShape(node,shape.shape);
      if (!report.conforms)
      {
        console.log(report.toString());
        allConfirm = false;
      }
    });
    if (allConfirm)
    {
      console.log('All instances conform to the shape');
    }
  }

  toString()
  {
    let str = `ValidationReport:`;
    if (this.conforms)
    {
      str += ` valid shape`;
    }
    else
    {
      str += '\n' + this.validationResults.size + ' validation results:\n';
      this.validationResults.forEach((validationResult) => {
        str += validationResult.toString();
      });
    }
    return str;
  }
}

export function getNodeShapeUri(packageName: string,shapeName: string): string
{
  return `${LINCD_DATA_ROOT}module/${URI.sanitize(packageName)}/shape/${URI.sanitize(
    shapeName,
  )}`;
}


const nodeShapeCallbacks = new Map<NamedNode, ((shape: NodeShape) => void)[]>();
export function getAndClearCallbacks(nodeShape: NamedNode): ((shape: NodeShape) => void)[] {
  const callbacks = nodeShapeCallbacks.get(nodeShape);
  nodeShapeCallbacks.delete(nodeShape);
  return callbacks;
}
export const addNodeShapeCallback = (nodeShape: NamedNode, callback: (shape: NodeShape) => void) => {
  if (!nodeShapeCallbacks.has(nodeShape)) {
    nodeShapeCallbacks.set(nodeShape, []);
  }
  nodeShapeCallbacks.get(nodeShape).push(callback);
}


//
// let lincdPackage = linkedPackage('lincd');
// lincdPackage.linkedShape(NodeShape);
// lincdPackage.linkedShape(PropertyShape);
//
// //ALL the following is to support Shape having get/set methods with property shapes
// //and Shape itself having a nodeShape
// //if we dont need Shape to have get/set methods (like label and type) then this can be removed
// Shape.shape = NodeShape.getFromURI('http://lincd/Shape');
// addNodeShapeToShapeClass(Shape.shape,Shape);
//
// //Here we can register the properties of the Shape class itself
// //We can't do that inside of Shape because it would cause circular dependencies
// registerPropertyShape(Shape.shape,createPropertyShape({
//     path: rdfs.label,
//   },
//   'label',
//   shacl.Literal,
// ));
// registerPropertyShape(Shape.shape,createPropertyShape(
//   {
//     path: rdf.type,
//   },
//   'type',
// ));
