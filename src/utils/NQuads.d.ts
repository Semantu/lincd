import { ICoreIterable } from '../interfaces/ICoreIterable.js';
import { Graph, Quad } from '../models.js';
import { QuadSet } from '../collections/QuadSet.js';
export declare class NQuads {
    static fromGraphs(graphs: ICoreIterable<Graph>, includeGraphs?: boolean): string;
    static fromQuads(quadset: QuadSet | Quad[], includeGraphs?: boolean, fixedGraph?: Graph): string;
    private static checkUri;
    private static toString;
}
