"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var NodeSet_js_1 = require("../collections/NodeSet.js");
var rdf_js_1 = require("../ontologies/rdf.js");
var models_js_1 = require("../models.js");
var Shape_js_1 = require("./Shape.js");
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(blanknode) {
        if (blanknode === void 0) { blanknode = new models_js_1.BlankNode(); }
        var _this = _super.call(this, blanknode) || this;
        if (!blanknode.hasProperty(rdf_js_1.rdf.first) &&
            !blanknode.has(rdf_js_1.rdf.rest, rdf_js_1.rdf.nil)) {
            //starting a NEW empty list is a bit difficult. Because officially the only empty list is rdf:nil.
            //But then how do we later add things to that list? We would need to switch out the node of this instance, which is not ideal in case the consumer of this class had saved/used that node already
            //So instead we're using a blanknode with rdf:type rdf:List
            blanknode.set(rdf_js_1.rdf.type, rdf_js_1.rdf.List);
        }
        return _this;
    }
    /**
     * Create a new list from a given set of nodes
     * Most performant way to create a new list if you already have the items in the list
     * @param items
     */
    List.createFrom = function (items) {
        //NOTE: this method exists because new List(nodes) will not work because all shapes require a node as first parameter, hence a static method
        var firstItem = this.getFirstItem(items);
        //create the list and the first entry manually
        var list = models_js_1.BlankNode.create();
        list.set(rdf_js_1.rdf.type, rdf_js_1.rdf.List);
        list.set(rdf_js_1.rdf.first, firstItem);
        //add all the other items
        List.appendItems(list, items);
        return List.getOf(list);
    };
    /**
     * Returns the contents of a rdf.List
     * Will return an empty set if the given node is not a list
     * @param list
     * @param result
     * @private
     */
    List.getContents = function (list, result) {
        if (result === void 0) { result = new NodeSet_js_1.NodeSet(); }
        if (list.hasProperty(rdf_js_1.rdf.first)) {
            result.add(list.getOne(rdf_js_1.rdf.first));
        }
        if (list.hasProperty(rdf_js_1.rdf.rest)) {
            var rest = list.getOne(rdf_js_1.rdf.rest);
            if (rest !== rdf_js_1.rdf.nil) {
                return List.getContents(rest, result);
            }
        }
        return result;
    };
    List.getFirstItem = function (items) {
        if (items instanceof NodeSet_js_1.NodeSet) {
            var firstItem = items.first();
            items.delete(firstItem);
            return firstItem;
        }
        else {
            return items.shift();
        }
    };
    List.appendItems = function (endPoint, items) {
        items.forEach(function (item) {
            var rest = List._createListEntry(item);
            endPoint.set(rdf_js_1.rdf.rest, rest);
            endPoint = rest;
        });
        //close the list
        endPoint.set(rdf_js_1.rdf.rest, rdf_js_1.rdf.nil);
        return endPoint;
    };
    List.getLastListItem = function (list) {
        var last;
        while (list && !list.has(rdf_js_1.rdf.rest, rdf_js_1.rdf.nil)) {
            last = list;
            list = list.getOne(rdf_js_1.rdf.rest);
        }
        return list || last;
    };
    List._createListEntry = function (item) {
        var list = models_js_1.BlankNode.create();
        list.set(rdf_js_1.rdf.first, item);
        list.set(rdf_js_1.rdf.rest, rdf_js_1.rdf.nil);
        return list;
    };
    //TODO: not working, needs to be fixed
    //see example here: http://www.snee.com/bobdc.blog/2014/04/rdf-lists-and-sparql.html
    // removeItem(item: Node): boolean {
    // 	return this._removeItem(this.namedNode, item);
    // }
    // private _removeItem(list: NamedNode, item: Node): boolean {
    // 	if (list.has(rdf.first, item)) {
    // 		let prev = list.getOneInverse(rdf.rest);
    // 		prev.overwrite(rdf.rest, list.getOne(rdf.rest));
    // 		list.remove();
    // 		return true;
    // 	} else if (!list.has(rdf.rest, rdf.nil)) {
    // 		return this._removeItem(list.getOne(rdf.rest) as NamedNode, item);
    // 	}
    // }
    List._append = function (item, last) {
        var next = this._createListEntry(item);
        last.overwrite(rdf_js_1.rdf.rest, next);
        return next;
    };
    List.prototype.getContents = function () {
        return List.getContents(this.namedNode);
    };
    List.prototype.isEmpty = function () {
        return !this.hasProperty(rdf_js_1.rdf.first);
    };
    List.prototype.addItem = function (item) {
        //we need to check if the list is empty when adding items one by one
        //we keep this out of _append for performance reasons
        if (this.isEmpty()) {
            this.set(rdf_js_1.rdf.first, item);
            this.set(rdf_js_1.rdf.rest, rdf_js_1.rdf.nil);
        }
        else {
            List._append(item, List.getLastListItem(this.namedNode));
        }
    };
    List.prototype.addItems = function (items) {
        var endPoint;
        if (this.isEmpty()) {
            endPoint = this.node;
            var firstItem = List.getFirstItem(items);
            this.set(rdf_js_1.rdf.first, firstItem);
        }
        else {
            endPoint = List.getLastListItem(this.namedNode);
        }
        //add all items to the end of the list
        List.appendItems(endPoint, items);
    };
    List.targetClass = rdf_js_1.rdf.List;
    return List;
}(Shape_js_1.Shape));
exports.List = List;
//# sourceMappingURL=List.js.map