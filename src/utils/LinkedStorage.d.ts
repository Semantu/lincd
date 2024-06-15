import { IQuadStore } from '../interfaces/IQuadStore.js';
import { Graph, NamedNode, Node } from '../models.js';
import { QuadSet } from '../collections/QuadSet.js';
import { CoreMap } from '../collections/CoreMap.js';
import { NodeSet } from '../collections/NodeSet.js';
import { Shape } from '../shapes/Shape.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
import { QuadArray } from '../collections/QuadArray.js';
import { CoreSet } from '../collections/CoreSet.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { LinkedQuery, QueryResponseToResultType, SelectQuery } from './LinkedQuery.js';
import { LinkedDataRequest } from './TraceShape.js';
export declare abstract class LinkedStorage {
    private static defaultStore;
    private static _initialized;
    private static graphToStore;
    private static shapesToGraph;
    private static nodeShapesToGraph;
    private static defaultStorageGraph;
    private static processingPromise;
    private static storedEvents;
    private static nodeToPropertyRequests;
    private static propShapeMap;
    static init(): void;
    /**
     * Returns true if Storage is set up to use any specific store
     * returns false if storage is managed manually, and no call like Storage.setDefaultStore has been made
     */
    static isInitialised(): boolean;
    static onEvent(eventType: any, ...args: any[]): void;
    static processStoredEvents(): Promise<void>;
    static getDefaultStore(): IQuadStore;
    static setDefaultStore(store: IQuadStore): void;
    static setDefaultStorageGraph(graph: Graph): void;
    static setGraphForShapes(graph: Graph, ...shapeClasses: (typeof Shape)[]): void;
    static setStoreForGraph(store: IQuadStore, graph: any): void;
    static getGraphForStore(store: IQuadStore): Graph;
    static getStores(): CoreSet<IQuadStore>;
    /**
     * Set the target store for instances of these shapes
     * @param store
     * @param shapes
     */
    static setStoreForShapes(store: IQuadStore, ...shapes: (typeof Shape)[]): void;
    /**
     *
     * @returns a promise that resolves when all storage events have been processed. For example shapes that are saved() have been stored and received a permanent URI.
     */
    static promiseUpdated(): Promise<void>;
    static getStoreForShapeClass(shapeClass: typeof Shape): IQuadStore;
    static getGraphForShapeClass(shapeClass: typeof Shape): Graph;
    static getGraphForNode(subject: NamedNode, checkShapes?: boolean): Graph;
    static getDefaultStorageGraph(): Graph;
    static getStoreForNode(node: NamedNode): IQuadStore;
    static getStoreForGraph(graph: Graph): IQuadStore;
    static getStoreMapForNodes(nodes: ICoreIterable<NamedNode>): CoreMap<IQuadStore, NamedNode[]>;
    static getStoreMapForShapes(shapes: ShapeSet): CoreMap<IQuadStore, Shape[]>;
    static setURIs(nodeUriMap: CoreMap<NamedNode, string>): Promise<[string, string][]>;
    static queryRaw<ResultType>(query: SelectQuery<any>, shapeClass: typeof Shape): Promise<QueryResponseToResultType<ResultType>>;
    static query<ResultType>(query: LinkedQuery<any, ResultType>): Promise<QueryResponseToResultType<ResultType>>;
    static update(toAdd: QuadSet, toRemove: QuadSet): Promise<void | any>;
    static clearProperties(subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>): Promise<boolean>;
    /**
     * @deprecated
     * @param shapeInstance
     * @param shapeOrRequest
     * @param byPassCache
     */
    static loadShape(shapeInstance: Shape, shapeOrRequest?: LinkedDataRequest, byPassCache?: boolean): Promise<QuadArray>;
    static loadShapes(shapeSet: ShapeSet, shapeOrRequest: LinkedDataRequest, byPassCache?: boolean): Promise<QuadArray>;
    static nodesAreLoaded(nodes: NodeSet, dataRequest: any): boolean | Promise<any>;
    static isLoaded(node: Node, dataRequest: any): boolean | Promise<any>;
    /**
     * Sets all the property paths of the subject nodes to be loaded
     * Handy for example when the server returned data already and you don't want the automatic loading to kick in.
     * WARNING: this assumes that ALL the values of each subject-predicate pair are loaded.
     * If the server returned just one and there are more, using this method means the other values will not automatically be loaded.
     */
    static setQuadsLoaded(quads: QuadSet): void;
    static setNodesLoaded(nodes: NodeSet, dataRequest: any, requestState?: true | Promise<any>): void;
    static setNodeLoaded(node: Node, request: any, requestState?: true | Promise<any>): void;
    private static startProcessingOnNextTick;
    private static finalizeProcess;
    private static assignQuadsToGraph;
    private static moveAllQuadsOfNodeIfRequired;
    private static onQuadsAltered;
    private static onClearedProperties;
    private static onRemoveNodes;
    private static onStoreNodes;
    private static groupQuadsBySubject;
    private static getTargetGraphMap;
    private static getStoreMapForIGraphObjects;
    private static getTargetStoreMap;
    private static getPredicateToPropertyShapesMap;
}
