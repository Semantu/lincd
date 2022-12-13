import {describe, expect, test} from '@jest/globals';
import {IQuadStore} from '../interfaces/IQuadStore';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {Storage} from '../utils/Storage';
import {Graph, Literal, NamedNode, Quad} from '../models';
import {QuadSet} from '../collections/QuadSet';
import {rdfs} from '../ontologies/rdfs';
import {rdf} from '../ontologies/rdf';
import {LinkedDataRequest, Shape} from '../shapes/Shape';
import {QuadArray} from '../collections/QuadArray';
import {NodeSet} from '../collections/NodeSet';
import {CoreMap} from '../collections/CoreMap';

let subject = NamedNode.create();
let predicate = NamedNode.create();
let value1 = NamedNode.create();
let value2 = NamedNode.create();
describe('property value sets', () => {
  test('can add a value to a node', () => {
    subject.getAll(predicate).add(value1);
    expect(subject.hasProperty(predicate)).toBe(true);
    expect(subject.getAllQuads().length).toBe(1);
  });
  test('can delete a value from a node', () => {
    subject.getAll(predicate).delete(value1);
    expect(subject.hasProperty(predicate)).toBe(false);
    expect(subject.getAllQuads().length).toBe(0);
  });
});
