import { IQuadStore } from '../interfaces/IQuadStore.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
import { Graph, NamedNode, Quad } from '../models.js';
import { QuadSet } from '../collections/QuadSet.js';
import { Shape } from '../shapes/Shape.js';
import { QuadArray } from '../collections/QuadArray.js';
import { NodeSet } from '../collections/NodeSet.js';
import { CoreMap } from '../collections/CoreMap.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { SelectQuery } from '../utils/LinkedQuery.js';
export declare class InMemoryStore extends Shape implements IQuadStore {
    protected contents: QuadSet;
    private initPromise;
    /**
     * You can use this to define (overwrite) which graph this store uses for its quads
     */
    targetGraph: Graph;
    constructor(n?: any);
    init(): Promise<any>;
    loadContents(): Promise<QuadSet>;
    /**
     * returns the contents of the InMemoryStore as a QuadSet
     * do NOT modify the returned QuadSet directly. Add or remove contents to this store instead
     */
    getContents(): QuadSet;
    update(toAdd: ICoreIterable<Quad>, toRemove: ICoreIterable<Quad>): Promise<any>;
    getDefaultGraph(): Graph;
    add(quad: Quad): Promise<any>;
    addMultiple(quads: QuadSet): Promise<any>;
    private _addMultiple;
    delete(quad: Quad): Promise<any>;
    deleteMultiple(quads: QuadSet): Promise<any>;
    private _deleteMultiple;
    clearProperties(subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>): Promise<boolean>;
    setURIs(nodeToCurrentUriMap: CoreMap<NamedNode, string>): Promise<[string, string][]>;
    protected onContentsUpdated(): Promise<boolean>;
    removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any>;
    query<ResultType = any>(query: SelectQuery<any>, shapeClass: typeof Shape): Promise<ResultType>;
    loadShape(shapeInstance: Shape, request: any): Promise<QuadArray>;
    loadShapes(shapeInstances: ShapeSet, request: any): Promise<QuadArray>;
    private getRequestQuads;
    protected addNewContents(quads: QuadArray | QuadSet): QuadArray | QuadSet;
}
export declare class TestStore implements IQuadStore {
    defaultGraph: Graph;
    contents: QuadSet;
    init(): any;
    reset(): void;
    update(added: ICoreIterable<Quad>, removed: ICoreIterable<Quad>): Promise<any>;
    query<ResultType>(query: SelectQuery<any>, shapeClass: Shape | typeof Shape): Promise<ResultType>;
    add(quad: Quad): Promise<any>;
    addMultiple(quads: QuadSet): Promise<any>;
    delete(quad: Quad): Promise<any>;
    deleteMultiple(quads: QuadSet): Promise<any>;
    setURIs(nodeToCurrentUriMap: CoreMap<NamedNode, string>): Promise<[string, string][]>;
    getDefaultGraph(): Graph;
    removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any>;
    loadShape(shapeInstance: Shape, request: any): Promise<QuadArray>;
    loadShapes(shapeSet: ShapeSet, request: any): Promise<QuadArray>;
    clearProperties(subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>): Promise<boolean>;
}
