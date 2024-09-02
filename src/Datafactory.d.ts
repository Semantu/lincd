import { Literal, NamedNode } from './models.js';
import { Term } from 'rdflib/lib/tf-types';
import { QuadSet } from './collections/QuadSet.js';
interface DataFactoryConfig {
    preventNewQuads?: boolean;
    emitEvents?: boolean;
    triggerStorage?: boolean;
}
export declare class Datafactory {
    private blankNodes;
    quads: QuadSet;
    private preventNewQuads;
    private emitEvents;
    private triggerStorage;
    constructor(config?: DataFactoryConfig);
    namedNode(uri: string): NamedNode;
    literal(value: any, languageOrDatatype: any): Literal;
    blankNode(value: any): any;
    defaultGraph(): any;
    quad(subject: Term, predicate: Term, object: Term, graph: Term): any;
}
export {};
