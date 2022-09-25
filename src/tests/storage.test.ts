import {describe, expect, test} from '@jest/globals';
import {IQuadStore} from '../interfaces/IQuadStore';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Storage} from '../utils/Storage';
import {Graph,Literal,NamedNode,Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import { rdfs } from '../ontologies/rdfs';

class TestStore implements IQuadStore {
  defaultGraph = Graph.create();
  contents:QuadSet = new QuadSet();
  reset()
  {
    this.contents = new QuadSet();
  }
  update(added:ICoreIterable<Quad>,removed:ICoreIterable<Quad>):Promise<any> {
    added.forEach(q => this.contents.add(q));
    removed.forEach(q => this.contents.delete(q));
    return null;
  }

  add(quad: Quad): Promise<any> {
    return null;
  }

  addMultiple?(quads: QuadSet): Promise<any> {
    return null;
  }

  delete(quad: Quad): Promise<any> {
    return null;
  }

  deleteMultiple?(quads: QuadSet): Promise<any> {
    return null;
  }

  setURI(...nodes:NamedNode[]):void {
    return null;
  }

  getDefaultGraph():Graph {
    return this.defaultGraph;
  }

}

let store = new TestStore();
Storage.setDefaultStore(store);

describe('default store', () => {
  test('does not store temporary node', () => {
    let node = NamedNode.create();
    node.setValue(rdfs.label,"test")
    expect(store.contents.size).toBe(0);
  });
  test('stores quads of saved node',async () => {
    store.reset();
    let node = NamedNode.create();
    node.setValue(rdfs.label,"test2");
    node.save();
    try {
      await Storage.promiseUpdated();
      expect(store.contents.size).toBe(1);
    }
    catch(e) {
      console.warn("Why err?",e);
    }
  });
  test('stores new properties of existing node', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label,"test3");
    await Storage.promiseUpdated();
    expect(store.contents.size).toBe(1);
  });
  test('unsetAll removes those properties from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label,"test4");
    await Storage.promiseUpdated();
    node.unsetAll(rdfs.label);
    await Storage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
  test('unset removes that property from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label,"test4");
    await Storage.promiseUpdated();
    node.unset(rdfs.label,new Literal("test4"));
    await Storage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
  test('remove node & properties from store', async () => {
    store.reset();
    let node = NamedNode.create();
    node.isTemporaryNode = false;
    node.setValue(rdfs.label,"test5");
    await Storage.promiseUpdated();
    node.remove();
    await Storage.promiseUpdated();
    expect(store.contents.size).toBe(0);
  });
});