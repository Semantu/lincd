import {describe, expect, test} from '@jest/globals';
import {NamedNode, Literal, Quad, defaultGraph} from '../models';

// Use unique URIs per test to avoid singleton collisions
let counter = 0;
const uri = (name: string) => `test://models-test/${++counter}/${name}`;

describe('RDF models smoke test', () => {
  test('NamedNode.getOrCreate returns singleton', () => {
    const u = uri('foo');
    const a = NamedNode.getOrCreate(u);
    const b = NamedNode.getOrCreate(u);
    expect(a).toBe(b);
    expect(a.uri).toBe(u);
  });

  test('Literal stores value', () => {
    const lit = new Literal('hello');
    expect(lit.value).toBe('hello');
  });

  test('NamedNode.set creates a quad and getOne retrieves it', () => {
    const subject = NamedNode.getOrCreate(uri('s'));
    const predicate = NamedNode.getOrCreate(uri('p'));
    const object = new Literal('value');

    subject.set(predicate, object);

    const result = subject.getOne(predicate);
    expect(result).toBe(object);
    expect(result.value).toBe('value');
  });

  test('NamedNode.getAll returns all objects for a predicate', () => {
    const subject = NamedNode.getOrCreate(uri('s'));
    const predicate = NamedNode.getOrCreate(uri('p'));
    const o1 = new Literal('a');
    const o2 = new Literal('b');

    subject.set(predicate, o1);
    subject.set(predicate, o2);

    const results = subject.getAll(predicate);
    expect(results.size).toBe(2);
  });

  test('Quad.getOrCreate returns singleton', () => {
    const s = NamedNode.getOrCreate(uri('s'));
    const p = NamedNode.getOrCreate(uri('p'));
    const o = NamedNode.getOrCreate(uri('o'));
    const g = defaultGraph;

    const q1 = Quad.getOrCreate(s, p, o, g);
    const q2 = Quad.getOrCreate(s, p, o, g);
    expect(q1).toBe(q2);
  });

  test('getAllInverse finds subjects pointing to a node', () => {
    const s = NamedNode.getOrCreate(uri('s'));
    const p = NamedNode.getOrCreate(uri('p'));
    const o = NamedNode.getOrCreate(uri('o'));

    s.set(p, o);

    const inverseResults = o.getAllInverse(p);
    expect(inverseResults.size).toBe(1);
    expect(inverseResults.has(s)).toBe(true);
  });
});
