import { NamedNode } from '../models.js';
export declare class ForwardReasoning {
    /**
     * Checks if a node has a certain type using forward reasoning.
     * Mimics inference of rdf:type & rdfs:subClassOf relations
     * @param node
     * @param targetType
     * @private
     */
    static hasType(node: NamedNode, targetType: NamedNode): boolean;
    /**
     * Checks if a type is a subClass of another type using forward reasoning.
     * Mimics inference of rdfs:subClassOf relations
     * @param type
     * @param targetType
     */
    static isSubClassOf(type: any, targetType: any): any;
}
