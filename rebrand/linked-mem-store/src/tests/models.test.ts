import {describe, expect, test} from '@jest/globals';
import {Graph, Literal, NamedNode, Quad} from '../models.js';
import {QuadSet} from '../collections/QuadSet.js';

const subjectUri = 'https://example.com/subject';
const predicateUri = 'https://example.com/predicate';

describe('RDF models', () => {
  test('NamedNode.getOrCreate returns stable instances', () => {
    const first = NamedNode.getOrCreate(subjectUri);
    const second = NamedNode.getOrCreate(subjectUri);

    expect(first).toBe(second);
    expect(first.uri).toBe(subjectUri);
  });

  test('Graph.getOrCreate returns stable instances', () => {
    const first = Graph.getOrCreate('https://example.com/graph');
    const second = Graph.getOrCreate('https://example.com/graph');

    expect(first).toBe(second);
    expect(first.value).toBe('https://example.com/graph');
  });

  test('QuadSet tracks subjects and objects', () => {
    const subject = NamedNode.getOrCreate(subjectUri);
    const predicate = NamedNode.getOrCreate(predicateUri);
    const object = new Literal('value');
    const quad = new Quad(subject, predicate, object);

    const set = new QuadSet();
    set.add(quad);

    expect(set.getSubjects().has(subject)).toBe(true);
    expect(set.getObjects().has(object)).toBe(true);
  });
});
