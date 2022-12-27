import {Literal, NamedNode} from '../models';
import {SHACL_Shape} from './SHACL';
import {shacl} from '../ontologies/shacl';
import {linkedShape} from '../package';

@linkedShape
export class PrefixDeclaration extends SHACL_Shape {
  static targetClass: NamedNode = shacl.PrefixDeclaration;

  get prefix(): string {
    return this.getOne(shacl.prefix).value;
  }

  set prefix(value: string) {
    this.overwrite(shacl.prefix, new Literal(value));
  }
}
