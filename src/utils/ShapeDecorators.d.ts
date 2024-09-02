import { BlankNode, Literal, NamedNode, Node } from '../models.js';
import { Shape } from '../shapes/Shape.js';
import { NodeSet } from '../collections/NodeSet.js';
import { NodeShape, PropertyShape } from '../shapes/SHACL.js';
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
export declare const literalProperty: (config: LiteralPropertyShapeConfig) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare const objectProperty: (config: ObjectPropertyShapeConfig) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
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
export declare const linkedProperty: (config: PropertyShapeConfig) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare function registerLinkedProperty(config: PropertyShapeConfig, propertyKey: string, shape: NodeShape, defaultNodeKind?: NamedNode): PropertyShape;
