import {Literal, NamedNode} from '../models';

export class LinkedString extends String {
  constructor(private subject: NamedNode, private property: NamedNode, private literal: Literal) {
    super(literal.value);
    // a workaround for babel to make `instanceof String` work in ES5
    this.constructor = LinkedString;
    this['__proto__'] = LinkedString.prototype;
  }
}
