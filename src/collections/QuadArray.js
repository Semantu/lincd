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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuadArray = void 0;
var NodeSet_js_1 = require("./NodeSet.js");
//TODO: test performance of QuadArray vs QuadSet and probably remove QuadArray
var QuadArray = /** @class */ (function (_super) {
    __extends(QuadArray, _super);
    function QuadArray() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    QuadArray.prototype.removeAll = function (alteration) {
        if (alteration === void 0) { alteration = false; }
        this.forEach(function (quad) { return quad.remove(alteration); });
    };
    QuadArray.prototype.moveTo = function (graph, alteration) {
        if (alteration === void 0) { alteration = true; }
        var result = new QuadArray();
        this.forEach(function (quad) {
            result.push(quad.moveToGraph(graph, alteration));
        });
        return result;
    };
    QuadArray.prototype.makeExplicit = function () {
        this.forEach(function (quad) { return quad.makeExplicit(); });
    };
    QuadArray.prototype.getSubjects = function () {
        var e_1, _a;
        //return new NamedNodeSet(this.map(quad => quad.subject).values());
        //that's short, but probably this is faster:
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                res.add(quad.subject);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    };
    QuadArray.prototype.getPredicates = function () {
        var e_2, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                res.add(quad.predicate);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return res;
    };
    QuadArray.prototype.getObjects = function () {
        var e_3, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                res.add(quad.object);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return res;
    };
    QuadArray.prototype.getExplicit = function () {
        return this.filter(function (quad) { return !quad.implicit; });
    };
    QuadArray.prototype.getImplicit = function () {
        return this.filter(function (quad) { return quad.implicit; });
    };
    QuadArray.prototype.turnOn = function () {
        this.forEach(function (quad) { return quad.turnOn(); });
    };
    QuadArray.prototype.turnOff = function () {
        this.forEach(function (quad) { return quad.turnOff(); });
    };
    QuadArray.prototype.toString = function () {
        //without this the toString() would print 3 URI's for each quad followed by a ',' which looks messy and unclear
        return this.join('\n');
    };
    QuadArray.prototype.print = function () {
        console.log(this.toString());
    };
    return QuadArray;
}(Array));
exports.QuadArray = QuadArray;
//# sourceMappingURL=QuadArray.js.map