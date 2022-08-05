import { rdf } from "../ontologies/rdf";
import { rdfs } from "../ontologies/rdfs";

export class ForwardReasoning {

  /**
   * Checks if a node has a certain type using forward reasoning.
   * Mimics inference of rdf:type & rdfs:subClassOf relations
   * @param node
   * @param targetType
   * @private
   */
  static hasType(node,targetType)
  {
    //checks if any of the types matches the target type, or is a subclass of the target type (then the node also has that inferred type) or if the type is a subclass of a type that is a subclass of the target type (iteratively, so could be any level deep)
    return node.getAll(rdf.type).some((type) => {
      return type === targetType || this.isSubClassOf(type,targetType);
    });
  }

  /**
   * Checks if a type is a subClass of another type using forward reasoning.
   * Mimics inference of rdfs:subClassOf relations
   * @param type
   * @param targetType
   */
  static isSubClassOf(type,targetType)
  {
    return type.has(rdfs.subClassOf,targetType) || type.getAll(rdfs.subClassOf).some(superType => this.isSubClassOf(superType,targetType));
  }


}