import {Literal, NamedNode} from '../models.js';

export class LinkedNumber extends Number {
  constructor(
    private subject: NamedNode,
    private property: NamedNode,
    private literal: Literal,
  ) {
    super(literal.value);
    // a workaround for babel to make `instanceof String` work in ES5
    this.constructor = LinkedNumber;
    this['__proto__'] = LinkedNumber.prototype;
  }
}
