import {Shape} from '../shapes/Shape';
import {linkedProperty,objectProperty} from '../utils/ShapeDecorators';
import {ShapeValuesSet} from '../collections/ShapeValuesSet';
import {NamedNode} from '../models';
import {describe,expect,test} from '@jest/globals';
import {linkedShape} from '../package';

let knows = NamedNode.create();
let person = NamedNode.create();
@linkedShape
class Person extends Shape {
  static targetClass:NamedNode = person;
  @objectProperty({
    path:knows,
    shape:Person,
    required:true
  })
  get knows():ShapeValuesSet {
    return this.getAllAs(knows,Person);
  }
}

let person1 = new Person();
let person2 = new Person();
person1.knows.add(person1);


describe('SHACL nodeshape validation',() => {
  test('can validate reference to same node of same type',() => {
    expect(person1.validate()).toBe(true);
  });
  test('fails when required path is not defined',() => {
    expect(person2.validate()).toBe(false);
  });
});
