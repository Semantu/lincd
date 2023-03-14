import {Literal, NamedNode} from '../models';
import {shacl} from '../ontologies/shacl';
import {linkedShape} from '../package';
import {Shape} from './Shape';

@linkedShape
export class PrefixDeclaration extends Shape {
  static targetClass: NamedNode = shacl.PrefixDeclaration;

  get prefix(): string {
    return this.getOne(shacl.prefix).value;
  }

  set prefix(value: string) {
    this.overwrite(shacl.prefix, new Literal(value));
  }
}
