"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForwardReasoning = void 0;
var rdf_js_1 = require("../ontologies/rdf.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
var owl_js_1 = require("../ontologies/owl.js");
var ForwardReasoning = /** @class */ (function () {
    function ForwardReasoning() {
    }
    /**
     * Checks if a node has a certain type using forward reasoning.
     * Mimics inference of rdf:type & rdfs:subClassOf relations
     * @param node
     * @param targetType
     * @private
     */
    ForwardReasoning.hasType = function (node, targetType) {
        var _this = this;
        //checks if any of the types matches the target type, or is a subclass of the target type (then the node also has that inferred type) or if the type is a subclass of a type that is a subclass of the target type (iteratively, so could be any level deep)
        //OR in the presence of an owl:equivalentClass property, if any of the equivalentClasses is equivalent to the target type, or is a subClassOf the targetClass
        return node.getAll(rdf_js_1.rdf.type).some(function (type) {
            return (type === targetType ||
                _this.isSubClassOf(type, targetType) ||
                (type.hasProperty(owl_js_1.owl.equivalentClass) &&
                    type.getAll(owl_js_1.owl.equivalentClass).some(function (equivalentClass) {
                        return (equivalentClass === targetType ||
                            _this.isSubClassOf(equivalentClass, targetType));
                    })));
        });
    };
    /**
     * Checks if a type is a subClass of another type using forward reasoning.
     * Mimics inference of rdfs:subClassOf relations
     * @param type
     * @param targetType
     */
    ForwardReasoning.isSubClassOf = function (type, targetType) {
        var _this = this;
        return (type.has(rdfs_js_1.rdfs.subClassOf, targetType) ||
            type
                .getAll(rdfs_js_1.rdfs.subClassOf)
                .some(function (superType) { return _this.isSubClassOf(superType, targetType); }));
    };
    return ForwardReasoning;
}());
exports.ForwardReasoning = ForwardReasoning;
//# sourceMappingURL=ForwardReasoning.js.map