/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NodeReferenceValue} from '../utils/NodeReference.js';
import {Shape} from './Shape.js';
import {shacl} from '../ontologies/shacl.js';
import {URI} from '../utils/URI.js';
import {toNodeReference} from '../utils/NodeReference.js';
import {QResult} from '../queries/SelectQuery.js';
import {getShapeClass} from '../utils/ShapeClass.js';

export const LINCD_DATA_ROOT: string = 'https://data.lincd.org/';

type NodeKindConfig = NodeReferenceValue | NodeReferenceValue[];

export type PropertyPathInput = NodeReferenceValue;
export type PropertyPathInputList = PropertyPathInput | PropertyPathInput[];

const toPlainNodeRef = (
  value: NodeReferenceValue | {id: string} | string,
): NodeReferenceValue => {
  if (typeof value === 'string') {
    return {id: value};
  }
  if (value && typeof value === 'object' && 'id' in value) {
    return {id: (value as NodeReferenceValue).id};
  }
  return toNodeReference(value as NodeReferenceValue);
};

const normalizePathInput = (
  value: PropertyPathInputList,
): PropertyPathInputList => {
  if (Array.isArray(value)) {
    return value.map((entry) => toPlainNodeRef(entry));
  }
  return toPlainNodeRef(value);
};

const normalizeNodeKind = (
  nodeKind?: NodeKindConfig,
  defaultNodeKind?: NodeReferenceValue,
): NodeReferenceValue | undefined => {
  if (!nodeKind) {
    return defaultNodeKind;
  }
  if (Array.isArray(nodeKind)) {
    const ids = nodeKind.map((entry) => entry?.id);
    const includesBlank = ids.includes(shacl.BlankNode.id);
    const includesNamed = ids.includes(shacl.IRI.id);
    const includesLiteral = ids.includes(shacl.Literal.id);
    if (includesBlank && includesNamed) {
      return shacl.BlankNodeOrIRI;
    }
    if (includesLiteral && includesNamed) {
      return shacl.IRIOrLiteral;
    }
    if (includesLiteral && includesBlank) {
      return shacl.BlankNodeOrLiteral;
    }
    return nodeKind[0];
  }
  return nodeKind;
};

export interface NodeShapeConfig {
  /**
   * Set to true to close the shape. This means any target node of this shape
   * that has properties outside the defined properties of this shape is invalid.
   */
  closed?: boolean;
  /**
   * Optional list of properties that are also permitted in addition to those explicitly listed by this shape.
   */
  ignoredProperties?: NodeReferenceValue[];
}

export interface LiteralPropertyShapeConfig extends PropertyShapeConfig {
  nodeKind?: NodeReferenceValue;
  /**
   * Values of the configured property must be less than the values of this 'lessThan' property
   */
  lessThan?: NodeReferenceValue | string;
  /**
   * Values of the configured property must be less than or equal the values of this 'lessThan' property
   */
  lessThanOrEquals?: NodeReferenceValue | string;
  /**
   * All values of this property must be higher than this number
   */
  minExclusive?: number | string;
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
  in?: NodeReferenceValue[];
}

export interface ObjectPropertyShapeConfig extends PropertyShapeConfig {
  nodeKind?: NodeReferenceValue;
  /**
   * Each value of this property must have this class as its rdf:type
   */
  class?: NodeReferenceValue | string;
  /**
   * The shape that values of this property path need to confirm to.
   * You need to provide a class that extends Shape.
   */
  shape?: typeof Shape | [string, string];
}

export interface PropertyShapeConfig {
  /**
   * The property path of this property shape.
   */
  path: PropertyPathInputList;
  /**
   * Indicates that this property must exist.
   * Shorthand for minCount=1
   */
  required?: boolean;
  /**
   * Each value must be of this node type.
   */
  nodeKind?: NodeKindConfig;
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
   */
  equals?: NodeReferenceValue | string;
  /**
   * Values of the configured property must differ from the values of this 'disjoint' property
   */
  disjoint?: NodeReferenceValue | string;
  /**
   * At least one value of this property must equal the given Node
   */
  hasValue?: NodeReferenceValue | string;
  name?: string;
  description?: string;
  order?: number;
  group?: string;
  /**
   * should correlate to the given datatype or class
   */
  defaultValue?: unknown;
  /**
   * Each value of the property must occur in this set
   */
  in?: NodeReferenceValue[];
  /**
   * Values of the configured property path are sorted by the values of this property path.
   */
  sortBy?: PropertyPathInputList;
}

export interface ParameterConfig {
  optional?: number;
}

export class NodeShape extends Shape {
  static targetClass = shacl.NodeShape;
  private _label?: string;
  description?: string;
  targetClass?: NodeReferenceValue;
  extends?: NodeReferenceValue;
  private propertyShapes: PropertyShape[] = [];

  constructor(node?: string | NodeReferenceValue) {
    super(node);
    if (this.id) {
      this.nodeRef = {id: this.id};
    }
  }

  nodeRef?: NodeReferenceValue;

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
  }

  get properties(): QResult<PropertyShape>[] {
    return this.propertyShapes.map((propertyShape) => propertyShape.getResult());
  }

  addPropertyShape(propertyShape: PropertyShape) {
    propertyShape.parentNodeShape = this;
    this.propertyShapes.push(propertyShape);
  }

  getPropertyShapes(includeSuperClasses: boolean = false): PropertyShape[] {
    if (!includeSuperClasses) {
      return [...this.propertyShapes];
    }
    const res: PropertyShape[] = [];
    let shapeClass = getShapeClass(this.id);
    if (!shapeClass) {
      return [...this.propertyShapes];
    }
    while (shapeClass && (shapeClass as typeof Shape).shape) {
      res.push(...(shapeClass as typeof Shape).shape.propertyShapes);
      if (shapeClass === Shape) {
        break;
      }
      shapeClass = Object.getPrototypeOf(shapeClass);
    }
    return res;
  }

  getPropertyShape(
    label: string,
    checkSubShapes: boolean = true,
  ): PropertyShape {
    let shapeClass = getShapeClass(this.id);
    let res: PropertyShape;
    if (!shapeClass) {
      return this.propertyShapes.find((shape) => shape.label === label);
    }
    while (!res && shapeClass && (shapeClass as typeof Shape).shape) {
      res = (shapeClass as typeof Shape).shape.propertyShapes.find(
        (shape) => shape.label === label,
      );
      if (checkSubShapes) {
        if (shapeClass === Shape) {
          break;
        }
        shapeClass = Object.getPrototypeOf(shapeClass);
      } else {
        break;
      }
    }
    return res;
  }

  validateNode(_node?: unknown): boolean {
    return true;
  }

  equals(other: NodeShape): boolean {
    return !!other && this.id === other.id;
  }
}

export class PropertyShape extends Shape {
  static targetClass = shacl.PropertyShape;
  private _label?: string;
  path: PropertyPathInputList;
  nodeKind?: NodeReferenceValue;
  datatype?: NodeReferenceValue;
  minCount?: number;
  maxCount?: number;
  name?: string;
  description?: string;
  order?: number;
  group?: string;
  class?: NodeReferenceValue;
  in?: NodeReferenceValue[];
  equalsConstraint?: NodeReferenceValue;
  disjoint?: NodeReferenceValue;
  hasValueConstraint?: NodeReferenceValue;
  defaultValue?: unknown;
  sortBy?: PropertyPathInputList;
  valueShape?: NodeReferenceValue;
  parentNodeShape?: NodeShape;

  constructor() {
    super();
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
  }

  getResult(): QResult<PropertyShape> {
    const result: QResult<PropertyShape, Record<string, unknown>> = {
      id: this.id,
      label: this.label,
      path: this.path,
    };
    if (this.nodeKind) {
      result.nodeKind = this.nodeKind;
    }
    if (this.datatype) {
      result.datatype = this.datatype;
    }
    if (typeof this.minCount === 'number') {
      result.minCount = this.minCount;
    }
    if (typeof this.maxCount === 'number') {
      result.maxCount = this.maxCount;
    }
    if (this.name) {
      result.name = this.name;
    }
    if (this.description) {
      result.description = this.description;
    }
    if (typeof this.order === 'number') {
      result.order = this.order;
    }
    if (this.group) {
      result.group = this.group;
    }
    if (this.class) {
      result.class = this.class;
    }
    if (this.in) {
      result.in = this.in;
    }
    if (this.equalsConstraint) {
      result.equals = this.equalsConstraint;
    }
    if (this.disjoint) {
      result.disjoint = this.disjoint;
    }
    if (this.hasValueConstraint) {
      result.hasValue = this.hasValueConstraint;
    }
    if (this.defaultValue !== undefined) {
      result.defaultValue = this.defaultValue;
    }
    if (this.sortBy) {
      result.sortBy = this.sortBy;
    }
    if (this.valueShape) {
      result.valueShape = this.valueShape;
    }
    return result as QResult<PropertyShape>;
  }

  clone(): this {
    const constructor = this.constructor as new () => this;
    const clone = new constructor();
    Object.assign(clone, this);
    return clone;
  }
}

const connectValueShape = <
  Config extends LiteralPropertyShapeConfig | ObjectPropertyShapeConfig,
>(
  config: Config,
  propertyKey: string,
  property: PropertyShape,
) => {
  if ((config as ObjectPropertyShapeConfig).shape) {
    const shapeConfig = (config as ObjectPropertyShapeConfig).shape;

    if (Array.isArray(shapeConfig)) {
      const [packageName, shapeName] = shapeConfig;
      const nodeShapeUri = getNodeShapeUri(packageName, shapeName);
      property.valueShape = {id: nodeShapeUri};
    } else {
      const shapeClass = shapeConfig as typeof Shape;
      if (shapeClass.shape) {
        property.valueShape = {id: shapeClass.shape.id};
      } else {
        onShapeSetup(
          shapeConfig,
          (nodeShape: NodeShape) => {
            property.valueShape = {id: nodeShape.id};
          },
          propertyKey,
        );
      }
    }
  }
};

export function registerPropertyShape(
  shape: NodeShape,
  propertyShape: PropertyShape,
) {
  const existing = shape.getPropertyShape(propertyShape.label, false);
  if (existing) {
    Object.assign(existing, propertyShape);
    return existing;
  }
  propertyShape.id = `${shape.id}/${propertyShape.label}`;
  shape.addPropertyShape(propertyShape);
  return propertyShape;
}

export function createPropertyShape<
  Config extends LiteralPropertyShapeConfig | ObjectPropertyShapeConfig,
>(
  config: Config,
  propertyKey: string,
  defaultNodeKind: NodeReferenceValue = null,
  shapeClass: typeof Shape | [string, string] = null,
) {
  const propertyShape = new PropertyShape();
  propertyShape.path = normalizePathInput(config.path);
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
  if ((config as LiteralPropertyShapeConfig).datatype) {
    propertyShape.datatype = toPlainNodeRef(
      (config as LiteralPropertyShapeConfig).datatype,
    );
  }

  if ((config as ObjectPropertyShapeConfig).class) {
    propertyShape.class = toPlainNodeRef(
      (config as ObjectPropertyShapeConfig).class,
    );
  }

  if (config.equals) {
    propertyShape.equalsConstraint = toPlainNodeRef(config.equals);
  }
  if (config.disjoint) {
    propertyShape.disjoint = toPlainNodeRef(config.disjoint);
  }
  if (config.hasValue) {
    propertyShape.hasValueConstraint = toPlainNodeRef(config.hasValue);
  }
  if (config.defaultValue !== undefined) {
    propertyShape.defaultValue = config.defaultValue;
  }
  if (config.in) {
    propertyShape.in = config.in.map((entry) => toPlainNodeRef(entry));
  }
  if (config.sortBy) {
    propertyShape.sortBy = normalizePathInput(config.sortBy);
  }

  propertyShape.nodeKind = normalizeNodeKind(config.nodeKind, defaultNodeKind);

  if (shapeClass) {
    onShapeSetup(shapeClass, (shape: NodeShape) => {
      connectValueShape(config, propertyKey, propertyShape);
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
  const cb = waitForSuperShapes
    ? (shape: NodeShape) => {
        const superClass = Object.getPrototypeOf(shapeClass) as typeof Shape;
        if (superClass.name === 'Shape') {
          callback(shape);
          return;
        }
        if (superClass.name === '') {
          console.error(
            `Shape ${shape.label} does not extend base class lincd/shapes/Shape. Make sure it extends Shape.`,
          );
          return;
        }
        onShapeSetup(
          superClass,
          () => {
            callback(shape);
          },
          propertyName,
          waitForSuperShapes,
        );
      }
    : callback;

  const safeCallback = (
    targetShapeClass: typeof Shape,
    innerCallback: (shape: NodeShape) => void,
  ) => {
    if (targetShapeClass.hasOwnProperty('shape')) {
      innerCallback((targetShapeClass as typeof Shape).shape);
    } else {
      if (!targetShapeClass['shapeCallbacks']) {
        targetShapeClass['shapeCallbacks'] = [];
      }
      targetShapeClass['shapeCallbacks'].push(innerCallback);
    }
  };

  if (Array.isArray(shapeClass)) {
    const [packageName, shapeName] = shapeClass;
    const nodeShapeId = getNodeShapeUri(packageName, shapeName);
    if (typeof document !== 'undefined') {
      window.addEventListener('load', () => {
        shapeClass = getShapeClass(nodeShapeId);
        if (!shapeClass) {
          console.warn(
            `Could not find value shape (${packageName}/${shapeName}) for accessor get ${propertyName}(). Likely because it is not bundled.`,
          );
          return;
        }
        safeCallback(shapeClass, cb);
      });
    } else {
      addNodeShapeCallback(nodeShapeId, cb);
    }
  } else {
    safeCallback(shapeClass, cb);
  }
}

const _linkedProperty = <
  Config extends ObjectPropertyShapeConfig | LiteralPropertyShapeConfig,
>(
  config: Config,
  defaultNodeKind: NodeReferenceValue = null,
) => {
  return function (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) {
    createPropertyShape(config, propertyKey, defaultNodeKind, target.constructor);
  };
};

export const literalProperty = (config: LiteralPropertyShapeConfig) => {
  return _linkedProperty<LiteralPropertyShapeConfig>(config, shacl.Literal);
};

export const objectProperty = (config: ObjectPropertyShapeConfig) => {
  return _linkedProperty<ObjectPropertyShapeConfig>(config, shacl.IRI);
};

export const linkedProperty = (
  config: ObjectPropertyShapeConfig | LiteralPropertyShapeConfig,
) => {
  return _linkedProperty(config);
};

export function disallowProperty(
  target: any,
  propertyKey: string,
  _descriptor: PropertyDescriptor,
) {
  onShapeSetup(
    target.constructor,
    (shape: NodeShape) => {
      const superClass = Object.getPrototypeOf(target.constructor) as typeof Shape;
      const superNodeShape = superClass.shape;
      const superPropertyShape = superNodeShape.getPropertyShape(
        propertyKey,
        true,
      );
      if (!superPropertyShape) {
        console.warn(
          `Property ${propertyKey} not found in super class ${superClass.name} or any of its super classes. Does it have a property decorator? Cannot disallow property ${target.constructor.name}.${propertyKey}`,
        );
        return;
      }
      const clonedPropertyShape = superPropertyShape.clone();
      clonedPropertyShape.maxCount = 0;
      registerPropertyShape(shape, clonedPropertyShape);
    },
    '',
    true,
  );
}

export function getNodeShapeUri(packageName: string, shapeName: string): string {
  return `${LINCD_DATA_ROOT}module/${URI.sanitize(packageName)}/shape/${URI.sanitize(
    shapeName,
  )}`;
}

const nodeShapeCallbacks = new Map<string, ((shape: NodeShape) => void)[]>();
export function getAndClearCallbacks(
  nodeShapeId: string,
): ((shape: NodeShape) => void)[] {
  const callbacks = nodeShapeCallbacks.get(nodeShapeId);
  nodeShapeCallbacks.delete(nodeShapeId);
  return callbacks;
}
export const addNodeShapeCallback = (
  nodeShapeId: string,
  callback: (shape: NodeShape) => void,
) => {
  if (!nodeShapeCallbacks.has(nodeShapeId)) {
    nodeShapeCallbacks.set(nodeShapeId, []);
  }
  nodeShapeCallbacks.get(nodeShapeId).push(callback);
};
