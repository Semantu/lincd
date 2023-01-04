/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode, Literal, NamedNode, Node} from '../models';
import {Shape} from './Shape';
import {shacl} from '../ontologies/shacl';
import {List} from './List';
import {xsd} from '../ontologies/xsd';
import {ShapeSet} from '../collections/ShapeSet';
import {NodeSet} from '../collections/NodeSet';
import {rdf} from '../ontologies/rdf';

export class SHACL_Shape extends Shape {
  static targetClass: NamedNode = shacl.Shape;
}

export class NodeShape extends SHACL_Shape {
  static targetClass: NamedNode = shacl.NodeShape;

  addPropertyShape(property: PropertyShape) {
    this.set(shacl.property, property.namedNode);
  }
  getPropertyShapes(): ShapeSet<PropertyShape> {
    return PropertyShape.getSetOf(this.getAll(shacl.property));
  }

  get targetNode(): NamedNode {
    return this.getOne(shacl.targetNode) as NamedNode;
  }

  set targetNode(value) {
    this.overwrite(shacl.targetNode, value);
  }

  get targetClass(): NamedNode {
    return this.getOne(shacl.targetClass) as NamedNode;
  }

  set targetClass(value) {
    this.overwrite(shacl.targetClass, value);
  }

  get in(): NamedNode {
    return this.getOne(shacl.in) as NamedNode;
  }

  set in(value: NamedNode) {
    this.overwrite(shacl.in, value);
  }

  get inList(): List {
    return this.hasProperty(shacl.in) ? List.getOf(this.getOne(shacl.in)) : null;
  }

  set inList(value: List) {
    this.overwrite(shacl.in, value.node);
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode> {
    let entities = new NodeSet<NamedNode>();
    if (this.targetClass) {
      entities.add(this.targetClass);
    }
    //add ontology entities of all property shapes
    this.getPropertyShapes().forEach((propertyShape) => {
      entities = entities.concat(propertyShape.getOntologyEntities());
    });
    return entities;
  }

  validate(node: Node): boolean {
    if (this.targetClass) {
      if (!(node instanceof NamedNode && node.has(rdf.type, this.targetClass))) {
        return false;
      }
    }
    let propertyShapes = this.getPropertyShapes();
    if (propertyShapes.size > 0) {
      if (node instanceof Literal) {
        return false;
      } else if (node instanceof NamedNode) {
        if (
          !this.getPropertyShapes().every((propertyShape) => {
            return propertyShape.validate(node);
          })
        ) {
          return false;
        }
      }
    }
    return true;
  }

  static getShapesOf(node: Node) {
    return this.getLocalInstances().filter((shape) => {
      return shape.validate(node);
    });
  }
}

export class ValidationResult {}

export class PropertyShape extends SHACL_Shape {
  static targetClass: NamedNode = shacl.PropertyShape;

  get class(): NamedNode {
    return this.getOne(shacl.class) as NamedNode;
  }

  set class(value: NamedNode) {
    this.overwrite(shacl.class, value);
  }

  get nodeShape(): NodeShape {
    return this.hasProperty(shacl.node) ? NodeShape.getOf(this.getOne(shacl.node)) : null;
  }

  set nodeShape(value: NodeShape) {
    this.overwrite(shacl.node, value.node);
  }

  get nodeKind(): NamedNode {
    return this.getOne(shacl.nodeKind) as NamedNode;
  }

  set nodeKind(value: NamedNode) {
    this.overwrite(shacl.nodeKind, value);
  }

  get datatype(): NamedNode {
    return this.getOne(shacl.datatype) as NamedNode;
  }

  set datatype(value: NamedNode) {
    this.overwrite(shacl.datatype, value);
  }

  get maxCount(): number {
    return parseInt(this.getValue(shacl.maxCount));
  }

  set maxCount(value: number) {
    this.overwrite(shacl.maxCount, new Literal(value.toString(), xsd.integer));
  }

  get minCount(): number {
    return parseInt(this.getValue(shacl.minCount));
  }

  set minCount(value: number) {
    this.overwrite(shacl.minCount, new Literal(value.toString(), xsd.integer));
  }

  get name(): string {
    return this.getValue(shacl.name);
  }

  // Setter overloading - would be nice to have one for String and another for Literal:
  // https://github.com/microsoft/TypeScript/issues/2521
  set name(value: string) {
    this.overwrite(shacl.name, new Literal(value));
  }

  get optional(): string {
    return this.getValue(shacl.optional);
  }

  set optional(value: string) {
    this.overwrite(shacl.optional, new Literal(value, xsd.boolean));
  }

  get path(): NamedNode {
    return this.getOne(shacl.path) as NamedNode;
  }

  set path(value: NamedNode) {
    this.overwrite(shacl.path, value);
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode> {
    //start with values of those properties that have a NamedNode as value
    let entities = new NodeSet<NamedNode>([this.class, this.path, this.datatype].filter((value) => value && true));
    if (this.nodeShape) {
      //if a node shape is defined, also add all the entities of that node shape
      entities = entities.concat(this.nodeShape.getOntologyEntities());
    }
    return entities;
  }

  validate(node: NamedNode): boolean {
    //TODO: make property nodes support property paths beyond a single property
    let property = this.path;
    let values = node instanceof NamedNode ? node.getAll(property) : null;
    if (this.class) {
      if (!values.every((value) => value instanceof NamedNode && value.has(rdf.type, this.class))) {
        return false;
      }
    }
    if (this.datatype) {
      if (!values.every((value) => value instanceof Literal && value.datatype === this.datatype)) {
        return false;
      }
    }
    if (this.nodeShape) {
      //every value should be a valid instance of this nodeShape
      let nodeShape = this.nodeShape;
      if (!values.every((value) => nodeShape.validate(value))) {
        return false;
      }
    }
    if (this.minCount) {
      if (values.size < this.minCount) {
        return false;
      }
    }
    if (this.maxCount) {
      if (values.size > this.maxCount) {
        return false;
      }
    }
    return true;
  }

  resolveFor(node: NamedNode)
  {
    //TODO: support more complex property paths
    return node.getAll(this.path);
  }
}
