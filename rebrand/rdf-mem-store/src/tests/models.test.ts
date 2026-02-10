import {describe, expect, test} from '@jest/globals';
import {NamedNode, Literal, Quad, defaultGraph} from '../models';
import {toNamedNode} from '../utils/toNamedNode';

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

  test('NamedNode.id aliases uri (NodeReferenceValue compatibility)', () => {
    const u = uri('node-with-id');
    const node = NamedNode.getOrCreate(u);
    expect(node.id).toBe(u);
    expect(node.id).toBe(node.uri);
  });

  test('NamedNode satisfies NodeReferenceValue interface', () => {
    const u = uri('ref-value');
    const node = NamedNode.getOrCreate(u);
    // NodeReferenceValue = {id: string}
    const ref: {id: string} = node;
    expect(ref.id).toBe(u);
  });
});

describe('toNamedNode helper', () => {
  test('passes through NamedNode instances unchanged', () => {
    const node = NamedNode.getOrCreate(uri('existing'));
    const result = toNamedNode(node);
    expect(result).toBe(node);
  });

  test('converts plain {id} to NamedNode', () => {
    const u = uri('plain-ref');
    const result = toNamedNode({id: u});
    expect(result).toBeInstanceOf(NamedNode);
    expect(result.uri).toBe(u);
    expect(result.id).toBe(u);
  });

  test('returns same singleton for same URI', () => {
    const u = uri('singleton-check');
    const fromRef = toNamedNode({id: u});
    const fromGetOrCreate = NamedNode.getOrCreate(u);
    expect(fromRef).toBe(fromGetOrCreate);
  });
});
