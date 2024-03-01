import {describe, expect, test} from '@jest/globals';
import {NamedNode} from '../models.js';

let subject = NamedNode.create();
let predicate = NamedNode.create();
let value1 = NamedNode.create();
let value2 = NamedNode.create();
describe('node value sets', () => {
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
