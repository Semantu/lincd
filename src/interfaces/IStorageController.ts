import {LinkedQuery} from '../utils/LinkedQuery.js';

export interface IStorageController {
  // new():MyType;
  // init();
  //
  // isInitialised(): boolean;
  //
  // onEvent(eventType, ...args);
  //
  // startProcessingOnNextTick();
  //
  // processStoredEvents();
  //
  // getDefaultStore(): IQuadStore;
  //
  // setDefaultStore(store: IQuadStore);
  //
  // setDefaultStorageGraph(graph: Graph);
  //
  // setGraphForShapes(graph: Graph, ...shapeClasses: (typeof Shape)[]);
  //
  // setStoreForGraph(store: IQuadStore, graph);
  //
  // getGraphForStore(store: IQuadStore): Graph;
  //
  // getStores(): CoreSet<IQuadStore>;
  //
  // setStoreForShapes(store: IQuadStore, ...shapes: (typeof Shape)[]);
  //
  // assignQuadsToGraph(quads: QuadSet | QuadArray, removeFromSet?: boolean);
  //
  // moveAllQuadsOfNodeIfRequired(
  //   alteredNodes: CoreMap<NamedNode, Graph>,
  // ): QuadSet;
  //
  // promiseUpdated(): Promise<void>;
  //
  // getGraphForNode(subject: NamedNode, checkShapes?: boolean): Graph;
  //
  // getDefaultStorageGraph();
  //
  // getStoreForNode(node: NamedNode);
  //
  // getStoreForGraph(graph: Graph);
  //
  // getStoreMapForNodes(
  //   nodes: ICoreIterable<NamedNode>,
  // ): CoreMap<IQuadStore, NamedNode[]>;
  //
  // getStoreMapForShapes(shapes: ShapeSet): CoreMap<IQuadStore, Shape[]>;
  //
  // getStoreMapForIGraphObjects(objects: ShapeSet | ICoreIterable<NamedNode>);
  //
  // getTargetStoreMap(quads: ICoreIterable<Quad>): CoreMap<IQuadStore, QuadArray>;
  //
  // setURIs(nodeUriMap: CoreMap<NamedNode, string>): Promise<[string, string][]>;

  query<ResultType = any>(
    // queryObject: LinkedDataGenericQuery,
    query: LinkedQuery<any>,
    // shapeClass: Shape | typeof Shape,
  ): Promise<ResultType>;

  //
  // update(toAdd: QuadSet, toRemove: QuadSet): Promise<void | any>;
  //
  // clearProperties(
  //   subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>,
  // ): Promise<boolean>;
  //
  // loadShapes(
  //   shapeSet: ShapeSet,
  //   shapeOrRequest: LinkedDataRequest,
  //   byPassCache?: boolean,
  // ): Promise<QuadArray>;
  //
  // loadShape(
  //   shapeInstance: Shape,
  //   shapeOrRequest?: LinkedDataRequest,
  //   byPassCache?: boolean,
  // ): Promise<QuadArray>;
  //
  // nodesAreLoaded(nodes: NodeSet, dataRequest): boolean | Promise<any>;
  //
  // isLoaded(node: Node, dataRequest: LinkedDataRequest): boolean | Promise<any>;
  //
  // getPredicateToPropertyShapesMap(): Map<NamedNode, PropertyShape[]>;
  //
  // setQuadsLoaded(quads: QuadSet);
  //
  // setNodesLoaded(
  //   nodes: NodeSet,
  //   dataRequest: LinkedDataRequest,
  //   requestState?: true | Promise<any>,
  // );
  //
  // setNodeLoaded(
  //   node: Node,
  //   request: LinkedDataRequest,
  //   requestState?: true | Promise<any>,
  // );
}

/* class decorator */
export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
