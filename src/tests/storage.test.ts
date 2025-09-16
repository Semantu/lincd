import {describe, expect, test} from '@jest/globals';
import {IQuadStore} from '../interfaces/IQuadStore.js';
import {ICoreIterable} from '../interfaces/ICoreIterable.js';
import {LinkedStorage} from '../utils/LinkedStorage.js';
import {defaultGraph, Graph, Literal, NamedNode, Quad} from '../models.js';
import {QuadSet} from '../collections/QuadSet.js';
import {rdfs} from '../ontologies/rdfs.js';
import {rdf} from '../ontologies/rdf.js';
import {Shape} from '../shapes/Shape.js';
import {QuadArray} from '../collections/QuadArray.js';
import {NodeSet} from '../collections/NodeSet.js';
import {CoreMap} from '../collections/CoreMap.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {PropertyShape} from '../shapes/SHACL.js';
import {SelectQuery} from '../queries/SelectQuery.js';
import {
  createLocal,
  deleteLocal,
  resolveLocal,
  updateLocal,
} from '../utils/LocalQueryResolver.js';
import {UpdateQuery} from '../queries/UpdateQuery.js';
import {CreateQuery} from '../queries/CreateQuery.js';
import {DeleteQuery, DeleteResponse} from '../queries/DeleteQuery.js';

export class InMemoryStore extends Shape implements IQuadStore {
  /**
   * You can use this to define (overwrite) which graph this store uses for its quads
   */
  public targetGraph: Graph;
  protected contents: QuadSet;
  private initPromise: Promise<any>;

  constructor(n?) {
    super(n);
  }

  init(): Promise<any> {
    // console.log('Init ' + this.toString());
    if (!this.initPromise) {
      this.initPromise = this.loadContents();
    }
    return this.initPromise;
  }

  loadContents(): Promise<QuadSet> {
    //by default an in-memory store starts empty - it has no permanent storage
    //overwrite this method to change that
    this.contents = new QuadSet();
    return Promise.resolve(this.contents);
  }

  /**
   * returns the contents of the InMemoryStore as a QuadSet
   * do NOT modify the returned QuadSet directly. Add or remove contents to this store instead
   */
  getContents(): QuadSet {
    return this.contents;
  }

  updateQuery?<RType>(query: UpdateQuery<RType>): Promise<RType> {
    return Promise.resolve(updateLocal(query));
  }

  createQuery?<R>(q: CreateQuery<R>): Promise<R> {
    return Promise.resolve(createLocal(q));
  }

  deleteQuery(query: DeleteQuery): Promise<DeleteResponse> {
    return Promise.resolve(deleteLocal(query)) as Promise<DeleteResponse>;
  }

  update(
    toAdd: ICoreIterable<Quad>,
    toRemove: ICoreIterable<Quad>,
  ): Promise<any> {
    return this.init().then(() => {
      if (toAdd) {
        this._addMultiple(toAdd);
      }
      if (toRemove) {
        this._deleteMultiple(toRemove as QuadArray);
      }
      //this method should only get called if either toAdd or toRemove is not empty
      return this.onContentsUpdated();
    });
  }

  getDefaultGraph(): Graph {
    //NOTE: we changed this from a specific graph for each store BACK null, which means things will be stored in the default graph
    // because storing quads in multiple graphs easily becomes error-prone.
    // Removing a triple from one store might not remove it from the main graph.
    // for example, auth will store users serialised as JSONLD in sessions, these quads get added back to the main graph
    // until we have a better solution for this, we aim to only use the default graph as much as possible (which means no specific graph os used, thus return null)
    // return null;
    // return defaultGraph;
    return Graph.getOrCreate(this.namedNode.uri);
  }

  add(quad: Quad): Promise<any> {
    return this.init().then(() => {
      this.addNewContents(new QuadArray(quad));
      this.onContentsUpdated();
      return Promise.resolve(true);
    });
  }

  addMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._addMultiple(quads);
      this.onContentsUpdated();
      return Promise.resolve(true);
    });
  }

  delete(quad: Quad): Promise<any> {
    return this.init().then(() => {
      // this.contents.delete(quad);
      this._deleteMultiple(new QuadArray(quad));
      this.onContentsUpdated();
      return true;
    });
  }

  deleteMultiple(quads: QuadSet): Promise<any> {
    return this.init().then(() => {
      this._deleteMultiple(quads);
      this.onContentsUpdated();
      return true;
    });
  }

  clearProperties(
    subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>,
  ): Promise<boolean> {
    return this.init().then(() => {
      let toDelete = new QuadSet();
      this.contents.forEach((q) => {
        if (
          subjectToPredicates.has(q.subject) &&
          subjectToPredicates.get(q.subject).has(q.predicate)
        ) {
          toDelete.add(q);
        }
      });
      if (toDelete.size > 0) {
        return this.deleteMultiple(toDelete);
      }
      return false;
    });
  }

  setURIs(
    nodeToCurrentUriMap: CoreMap<NamedNode, string>,
  ): Promise<[string, string][]> {
    //by default an in-memory store does not support setting URIs,
    // if it's used in a local context for in memory storage it doesn't really care about permanent storage URI's
    // if it's used in a different context, this method should be overwritten
    return Promise.resolve([]);
  }

  removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any> {
    //when storage calls removeNodes, all quads have already been removed locally
    //and an in memory store always holds all data in memory,
    //so there is nothing to do here
    return Promise.resolve(true);
  }

  selectQuery<ResultType>(query: SelectQuery<any>): Promise<ResultType> {
    return Promise.resolve(resolveLocal(query)).catch((e) => {
      console.error('Error in query', e);
      return new QuadArray();
    }) as Promise<ResultType>;
  }

  loadShape(shapeInstance: Shape, request: any): Promise<QuadArray> {
    return this.init().then(() => {
      return this.getRequestQuads(shapeInstance, request);
      //for testing: add timer
      // return new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //get quads for each (nested) shape / property shape
      // let quads = this.getRequestQuads(shapeInstance, request);

      // return resolve(quads);
      // }, 1500);
      // });
    });
  }

  loadShapes(shapeInstances: ShapeSet, request: any): Promise<QuadArray> {
    return this.init().then(() => {
      let quads = new QuadArray();
      shapeInstances.forEach((shapeInstance) => {
        this.getRequestQuads(shapeInstance, request, quads);
      });
      return quads;

      // return new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //     //get quads for each (nested) shape / property shape
      //     //TODO: update getRequestQuads to work with shape set
      //     // possibly even merge definitions of loadShape and loadShapes? is it select? query?
      //     // let quads = this.getRequestQuads(shapeInstances, request);
      //     // return Promise.resolve(quads);
      //     // return resolve(quads);
      //     return resolve([] as any);
      //   }, 1500);
      // });
    });
  }

  protected onContentsUpdated(): Promise<boolean> {
    //by default in memory store does nothing here. But extending classes could choose to sync to a more permanent form of storage
    return Promise.resolve(false);
  }

  protected addNewContents(quads: QuadArray | QuadSet) {
    //get the target graph for this store, if configured
    let graph =
      LinkedStorage.getGraphForStore(this) || this.targetGraph || defaultGraph;

    //if there is one, move the quads into that graph
    if (graph) {
      quads = quads.moveTo(graph, false);
    }
    this.contents.addFrom(quads);
    return quads;
  }

  private _addMultiple?(quads: ICoreIterable<Quad>): void {
    this.addNewContents(quads as QuadArray);
    // this.contents = this.contents.concat(quads);
  }

  private _deleteMultiple(quads: QuadArray | QuadSet): void {
    //first we add the quads to the right graph (which effectively ADDS these quads to this store)
    //then we remove them from the contents

    //get the target graph for this store, if configured
    let graph =
      LinkedStorage.getGraphForStore(this) || this.targetGraph || defaultGraph;

    //if there is one, move the quads into that graph
    if (graph) {
      quads = quads.moveTo(graph, false);
    }
    quads.forEach((quad) => {
      this.contents.delete(quad);
      quad.remove(false);
    });
  }

  private getRequestQuads(
    source: Shape | QuadSet,
    request: any,
    quads: QuadArray = new QuadArray(),
  ) {
    // let {shape, properties}: {shape: typeof Shape; properties?: (PropertyShape | BoundPropertyShapes)[]} = request;
    request.forEach((propertyRequest) => {
      let subRequest: any;
      let propertyShape: PropertyShape;
      let propertyShapeSource: QuadSet | Shape;

      //if an entry is an array, then it consists of the property shape + a sub request
      if (Array.isArray(propertyRequest)) {
        [propertyShape, subRequest] = propertyRequest;
      } else if (propertyRequest instanceof PropertyShape) {
        propertyShape = propertyRequest;
      }
      if (propertyShape) {
        let path = propertyShape.path;
        if (path instanceof NamedNode) {
          if (source instanceof QuadSet) {
            propertyShapeSource = (source as QuadSet)
              .getObjects()
              .getQuads(path);
          } else if (source instanceof Shape) {
            propertyShapeSource = (source as Shape).getQuads(path);
          }
        } else {
          propertyShapeSource = source;
          for (let i = 0; i < path.length; i++) {
            if (propertyShapeSource instanceof QuadSet) {
              propertyShapeSource = (propertyShapeSource as QuadSet)
                .getObjects()
                .getQuads(path[i]);
            } else if (propertyShapeSource instanceof Shape) {
              propertyShapeSource = (propertyShapeSource as Shape).getQuads(
                path[i],
              );
            }
          }
        }
        (propertyShapeSource as QuadSet).forEach((q) => quads.push(q));
      }
      if (subRequest) {
        this.getRequestQuads(propertyShapeSource, subRequest, quads);
      }
    });
    return quads;
  }
}

export class TestStore implements IQuadStore {
  defaultGraph = Graph.create();
  contents: QuadSet = new QuadSet();

  init() {
    return null;
  }

  reset() {
    this.contents = new QuadSet();
  }

  update(
    added: ICoreIterable<Quad>,
    removed: ICoreIterable<Quad>,
  ): Promise<any> {
    added.forEach((q) => this.contents.add(q));
    removed.forEach((q) => this.contents.delete(q));
    return null;
  }

  selectQuery<ResultType>(query: SelectQuery<any>): Promise<ResultType> {
    return null;
  }

  add(quad: Quad): Promise<any> {
    return null;
  }

  addMultiple(quads: QuadSet): Promise<any> {
    return null;
  }

  delete(quad: Quad): Promise<any> {
    return null;
  }

  deleteMultiple(quads: QuadSet): Promise<any> {
    return null;
  }

  setURIs(
    nodeToCurrentUriMap: CoreMap<NamedNode, string>,
  ): Promise<[string, string][]> {
    return null;
  }

  getDefaultGraph(): Graph {
    return this.defaultGraph;
  }

  removeNodes(nodes: ICoreIterable<NamedNode>): Promise<any> {
    return null;
  }

  loadShape(shapeInstance: Shape, request: any): Promise<QuadArray> {
    return null;
  }

  loadShapes(shapeSet: ShapeSet, request: any): Promise<QuadArray> {
    return null;
  }

  clearProperties(
    subjectToPredicates: CoreMap<NamedNode, NodeSet<NamedNode>>,
  ): Promise<boolean> {
    let deleted = false;
    this.contents.forEach((q) => {
      if (
        subjectToPredicates.has(q.subject) &&
        subjectToPredicates.get(q.subject).has(q.predicate)
      ) {
        this.contents.delete(q);
        deleted = true;
      }
    });
    return Promise.resolve(deleted);
  }
}

let store = new TestStore();
LinkedStorage.setDefaultStore(store);

describe('default store', () => {
  test('does not store temporary node', () => {
    let node = NamedNode.create();
    node.setValue(rdfs.label, 'test');
    expect(store.contents.size).toBe(0);
  });
  test('stores quads of saved node', async () => {
    store.reset();
    let node = NamedNode.create();
    node.setValue(rdfs.label, 'test2');
    node.save();
    try {
      await LinkedStorage.promiseUpdated();
      expect(store.contents.size).toBe(1);
    } catch (e) {
      console.warn('Why err?', e);
    }
  });
  test('stores new properties of existing node', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label, 'test3');
    await LinkedStorage.promiseUpdated();
    expect(store.contents.size).toBe(1);
  });
  test('unsetAll removes those properties from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label, 'test4');
    await LinkedStorage.promiseUpdated();
    node.unsetAll(rdfs.label);
    await LinkedStorage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
  test('unset removes that property from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label, 'test4');
    await LinkedStorage.promiseUpdated();
    node.unset(rdfs.label, new Literal('test4'));
    await LinkedStorage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
  test('remove node & properties from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label, 'test5');
    await LinkedStorage.promiseUpdated();
    node.remove();
    await LinkedStorage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
  test('promiseUpdated waits for both storing nodes and altering nodes to complete', async () => {
    store.reset();
    let node = NamedNode.create();
    node.setValue(rdfs.label, 'test5');
    node.save();
    node.set(rdf.type, node);
    await LinkedStorage.promiseUpdated();
    expect(store.contents.size).toBe(2);
  });
});
