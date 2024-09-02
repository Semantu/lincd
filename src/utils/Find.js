"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Find = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var NodeSet_js_1 = require("../collections/NodeSet.js");
var models_js_1 = require("../models.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var rdfs_js_1 = require("../ontologies/rdfs.js");
var QuadSet_js_1 = require("../collections/QuadSet.js");
var URI_js_1 = require("./URI.js");
var Find = /** @class */ (function () {
    function Find() {
    }
    Find.byPropertyValues = function (valuesToProperties, targetType, includeLocalResources, exactMatch, sanitized) {
        var _this = this;
        if (includeLocalResources === void 0) { includeLocalResources = true; }
        if (exactMatch === void 0) { exactMatch = true; }
        if (sanitized === void 0) { sanitized = true; }
        // var results =new NodeSet<NamedNode>();
        var result = new QuadSet_js_1.QuadSet();
        var subjects;
        valuesToProperties.forEach(function (searchValue, properties) {
            var iterationResult = _this.byPropertyValue(searchValue, properties, targetType, includeLocalResources, exactMatch, sanitized, subjects);
            var iterationSubjects = iterationResult.getSubjects();
            //after added this results for this searchValue..
            //if this was the first iteration
            if (!subjects) {
                //then we will use the subjects of this loop to check against next iterations
                subjects = iterationSubjects;
                result = iterationResult;
            }
            else {
                //else we need to check if all the subjects from the first iteration ALSO occurred in this iteration
                subjects.forEach(function (subject) {
                    if (!iterationSubjects.has(subject)) {
                        //if not, we retract results from that subject
                        result = result.filter(function (quad) {
                            return quad.subject !== subject;
                        });
                    }
                });
            }
        });
        return result;
    };
    /**
     * Returns a set of quads where the search value is found and the predicate matches the given property/properties/property-type
     * @param searchValue
     * @param properties a single property, a set of properties, a property type or '*' to indicate ANY property
     * @param targetType only include quads whos subject is of this type
     * @param includeLocalResources if false, temporary / local nodes will be excluded from results
     * @param exactMatch if true, only returns exact matches, if false, returns values that START WITH the given searchValue
     * @param sanitized indicates whether the searchValue has been sanitized
     * @param subjects if given, will only return quads who's subject occurs in this set
     */
    Find.byPropertyValue = function (searchValue, properties, targetType, includeLocalResources, exactMatch, sanitized, subjects) {
        var _this = this;
        if (properties === void 0) { properties = '*'; }
        if (includeLocalResources === void 0) { includeLocalResources = true; }
        var result = new QuadSet_js_1.QuadSet();
        var propertySet;
        if (properties instanceof models_js_1.NamedNode) {
            //if a propertyOrPropertyType TYPE was given (like ObjectProperty or IdProperty) then we look for ALL properties that are instances of this type
            if (properties.has(rdf_js_1.rdf.type, rdfs_js_1.rdfs.Class) &&
                properties.has(rdfs_js_1.rdfs.subClassOf, rdf_js_1.rdf.Property)) {
                propertySet = properties.getAllInverse(rdf_js_1.rdf.type);
            }
            else {
                propertySet = new NodeSet_js_1.NodeSet([properties]);
            }
        }
        else if (properties == '*') {
            //by default use all properties
            propertySet = rdf_js_1.rdf.Property.getAllInverse(rdf_js_1.rdf.type);
        }
        else if (properties instanceof NodeSet_js_1.NodeSet) {
            propertySet = properties;
        }
        else {
            throw Error("Invalid property given. Please provide a property, a property type, a set of properties or '*' to search for this value for any property");
        }
        //go through all properties
        propertySet.forEach(function (searchProp) {
            var potentialQuads;
            //if we already have a set of subjects to test (from a previous result for example, see byPropertyValues)
            if (subjects) {
                //then we only have to look through the results of these subjects
                potentialQuads = subjects.getQuads(searchProp);
            }
            else {
                //if not, then we look through ALL LOCALLY KNOWN USAGES of this property
                potentialQuads = searchProp.getAsPredicateQuads();
            }
            if (!potentialQuads)
                return;
            //go through the quads for this property
            potentialQuads.forEach(function (quad) {
                //option to exclude local nodes
                if (!includeLocalResources && quad.subject.isTemporaryNode)
                    return;
                //option to only include subjects of a certain type
                if (targetType && !quad.subject.has(rdf_js_1.rdf.type, targetType))
                    return;
                if (searchValue instanceof models_js_1.NamedNode && quad.object === searchValue) {
                    result.add(quad);
                }
                //if we find a value that matches the search string
                else if (_this.valueMatches(quad.object, searchValue, sanitized, exactMatch)) {
                    result.add(quad);
                }
            });
        });
        return result;
    };
    Find.valueMatches = function (propertyValueResource, value, sanitized, exactMatch) {
        //if local nodes are allowed not allowed and the object is a local node, dont continue
        if (propertyValueResource instanceof models_js_1.NamedNode)
            return false;
        //get the value
        var propertyValue = propertyValueResource.value;
        if (sanitized)
            propertyValue = URI_js_1.URI.sanitize(propertyValue);
        //not exact match? then we only test if the value starts with the identifier we're searching for
        if (!exactMatch)
            propertyValue = propertyValue.substr(0, value.length);
        //	if the value matches and the target type matches
        if (propertyValue === value) {
            return true;
        }
        return false;
    };
    return Find;
}());
exports.Find = Find;
//# sourceMappingURL=Find.js.map