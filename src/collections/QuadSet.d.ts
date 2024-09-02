import { Graph, NamedNode, Node, Quad } from '../models.js';
import { CoreSet } from './CoreSet.js';
import { NodeSet } from './NodeSet.js';
export declare class QuadSet extends CoreSet<Quad> {
    removeAll(alteration?: boolean): void;
    moveTo(graph: Graph, alteration?: boolean): QuadSet;
    makeExplicit(): void;
    getSubjects(): NodeSet<NamedNode>;
    getPredicates(): NodeSet<NamedNode>;
    getObjects(): NodeSet;
    getNamedNodeObjects(): NodeSet<NamedNode>;
    getLiteralObjects(): NodeSet;
    getLike(subject?: NamedNode, predicate?: NamedNode, object?: Node): this;
    getNamedNodes(): NodeSet<NamedNode>;
    getNodes(): NodeSet;
    hasNode(node: Node): boolean;
    getExplicit(): this;
    getImplicit(): this;
    turnOn(): void;
    turnOff(): void;
    toString(): string;
}
