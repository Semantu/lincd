import { IGraphObject } from './IGraphObject.js';
import { NamedNode, Node } from '../models.js';
import { ICoreIterable } from './ICoreIterable.js';
export interface IShape extends IGraphObject {
    namedNode: NamedNode;
    node: Node;
    set(property: NamedNode, value: Node): boolean;
    mset(property: NamedNode, values: ICoreIterable<Node>): boolean;
    overwrite(property: NamedNode, value: Node): boolean;
    moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean;
    unset(property: NamedNode, value: Node): boolean;
    unsetAll(property: NamedNode): boolean;
    hasExact(property: NamedNode, value: Node): boolean;
    has(property: NamedNode, value: Node): boolean;
    hasProperty(property: NamedNode): boolean;
    hasInverseProperty(property: NamedNode): boolean;
    hasInverse(property: NamedNode, value: Node): boolean;
    hasPath(properties: NamedNode[]): boolean;
    hasPathTo(properties: NamedNode[], value?: Node): boolean;
    hasPathToSomeInSet(properties: NamedNode[], endPoints?: ICoreIterable<Node>): boolean;
    hasExplicit(property: NamedNode, value: Node): boolean;
}
