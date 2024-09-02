"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
var rdfs_js_1 = require("../ontologies/rdfs.js");
var Order = /** @class */ (function () {
    function Order() {
    }
    Order.propertiesByDepth = function (properties) {
        return properties.sort(function (c1, c2) {
            return c1.has(rdfs_js_1.rdfs.subPropertyOf, c2) ? -1 : 1;
        });
    };
    /**
     * Counts the number of connections each node makes to antoher
     * and then returns a new set of the same nodes sorted by that numb connections with the most connections first
     * @param nodes
     * @param property
     * @param shortestPathFirst
     * @returns {NodeSet<NamedNode>}
     */
    Order.byCrossPaths = function (nodes, property, shortestPathFirst) {
        if (shortestPathFirst === void 0) { shortestPathFirst = false; }
        var counts = this.getCrossPaths(nodes, property);
        if (shortestPathFirst) {
            return nodes.sort(function (r1, r2) {
                //use strings as backup when counts are equal to make sure sorting is always the same
                if (counts.get(r1) == counts.get(r2)) {
                    return r1.toString() >= r2.toString() ? 1 : -1;
                }
                return counts.get(r1) > counts.get(r2) ? 1 : -1; //if bigger, then 1, thus lower
            });
        }
        else {
            //by default return the longest path first
            return nodes.sort(function (r1, r2) {
                //use strings as backup when counts are equal to make sure sorting is always the same
                if (counts.get(r1) == counts.get(r2)) {
                    return r1.toString() >= r2.toString() ? -1 : 1;
                }
                return counts.get(r1) >= counts.get(r2) ? -1 : 1; //if bigger, then -1, thus higher
            });
        }
    };
    Order.getCrossPaths = function (nodes, property) {
        var counts = new Map();
        nodes.forEach(function (node) {
            var crossRelations = 0;
            nodes.forEach(function (resource2) {
                //'cross' => against others => not against self
                if (node === resource2)
                    return;
                if (node.has(property, resource2)) {
                    //counts.set(node.uri,[counts.get(node.uri)[0]++,node]);
                    //counts[node.uri]++;
                    crossRelations++;
                }
            });
            counts.set(node, crossRelations);
        });
        return counts;
    };
    return Order;
}());
exports.Order = Order;
//# sourceMappingURL=Order.js.map