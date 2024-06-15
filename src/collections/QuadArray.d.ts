import { Graph, NamedNode, Quad } from '../models.js';
import { NodeSet } from './NodeSet.js';
export declare class QuadArray extends Array<Quad> {
    removeAll(alteration?: boolean): void;
    moveTo(graph: Graph, alteration?: boolean): QuadArray;
    makeExplicit(): void;
    getSubjects(): NodeSet<NamedNode>;
    getPredicates(): NodeSet<NamedNode>;
    getObjects(): NodeSet;
    getExplicit(): Quad[];
    getImplicit(): Quad[];
    turnOn(): void;
    turnOff(): void;
    toString(): string;
    print(): void;
}
