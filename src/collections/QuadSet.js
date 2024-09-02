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
exports.QuadSet = void 0;
var CoreSet_js_1 = require("./CoreSet.js");
var NodeSet_js_1 = require("./NodeSet.js");
var QuadSet = /** @class */ (function (_super) {
    __extends(QuadSet, _super);
    function QuadSet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    QuadSet.prototype.removeAll = function (alteration) {
        if (alteration === void 0) { alteration = false; }
        this.forEach(function (quad) { return quad.remove(alteration); });
    };
    QuadSet.prototype.moveTo = function (graph, alteration) {
        if (alteration === void 0) { alteration = true; }
        var newSet = new QuadSet();
        this.forEach(function (quad) {
            newSet.add(quad.moveToGraph(graph, alteration));
        });
        return newSet;
    };
    QuadSet.prototype.makeExplicit = function () {
        this.forEach(function (quad) { return quad.makeExplicit(); });
    };
    QuadSet.prototype.getSubjects = function () {
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
    QuadSet.prototype.getPredicates = function () {
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
    QuadSet.prototype.getObjects = function () {
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
    QuadSet.prototype.getNamedNodeObjects = function () {
        var e_4, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                //using instanceof NamedNode here will cause circular references
                if ('uri' in quad.object) {
                    res.add(quad.object);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return res;
    };
    QuadSet.prototype.getLiteralObjects = function () {
        var e_5, _a;
        var res = new NodeSet_js_1.NodeSet();
        try {
            for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                var quad = _c.value;
                //using instanceof Literal here will cause circular references
                if (!('uri' in quad.object)) {
                    res.add(quad.object);
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return res;
    };
    QuadSet.prototype.getLike = function (subject, predicate, object) {
        return this.filter(function (quad) {
            return ((!subject || quad.subject === subject) &&
                (!predicate || quad.predicate === predicate) &&
                (!object || quad.object === object));
        });
    };
    QuadSet.prototype.getNamedNodes = function () {
        return new NodeSet_js_1.NodeSet()
            .concat(this.getSubjects())
            .concat(this.getPredicates())
            .concat(this.getNamedNodeObjects());
    };
    QuadSet.prototype.getNodes = function () {
        return new NodeSet_js_1.NodeSet()
            .concat(this.getSubjects())
            .concat(this.getPredicates())
            .concat(this.getObjects());
    };
    QuadSet.prototype.hasNode = function (node) {
        return this.some(function (quad) {
            return (quad.subject === node || quad.predicate === node || quad.object === node);
        });
    };
    QuadSet.prototype.getExplicit = function () {
        return this.filter(function (quad) { return !quad.implicit; });
    };
    QuadSet.prototype.getImplicit = function () {
        return this.filter(function (quad) { return quad.implicit; });
    };
    QuadSet.prototype.turnOn = function () {
        return this.forEach(function (t) { return t.turnOn(); });
    };
    QuadSet.prototype.turnOff = function () {
        return this.forEach(function (t) { return t.turnOff(); });
    };
    QuadSet.prototype.toString = function () {
        var str = '';
        this.forEach(function (item) { return (str += '\t' + item.toString() + '\n'); });
        return 'QuadSet(' + this.size + ') [\n' + str + ']';
    };
    return QuadSet;
}(CoreSet_js_1.CoreSet));
exports.QuadSet = QuadSet;
//# sourceMappingURL=QuadSet.js.map