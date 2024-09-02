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
var globals_1 = require("@jest/globals");
var models_js_1 = require("../models.js");
var Shape_js_1 = require("../shapes/Shape.js");
var Person = /** @class */ (function (_super) {
    __extends(Person, _super);
    function Person() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Person.prototype, "knows", {
        get: function () {
            return this.getAllAs(knows, Person);
        },
        enumerable: false,
        configurable: true
    });
    return Person;
}(Shape_js_1.Shape));
var personNode1 = models_js_1.NamedNode.create();
var personNode2 = models_js_1.NamedNode.create();
var personNode3 = models_js_1.NamedNode.create();
var person1 = new Person(personNode1);
var person2 = new Person(personNode2);
var person3 = new Person(personNode3);
var knows = models_js_1.NamedNode.create();
personNode1.set(knows, personNode2);
(0, globals_1.describe)('shape value set', function () {
    (0, globals_1.test)('reflects current amount of properties', function () {
        (0, globals_1.expect)(person1.knows.size).toBe(1);
    });
    (0, globals_1.test)('matches shapes of the same node', function () {
        //ShapeValueSets make their own instances of shapes which may not be the same instance
        // as another instance of the same shape for the same node
        //in this case, person2 will not exist in the set by true identity, but an equivalent shape DOES exist in the set
        //so this should return true. See ShapeSet.has tests and implementation
        (0, globals_1.expect)(person1.knows.has(person2)).toBe(true);
    });
    (0, globals_1.test)('adds nodes to the graph when you add a new shape to them', function () {
        //first we add and get the size of THAT set
        (0, globals_1.expect)(person1.knows.add(person3).size).toBe(2);
        //then we get the set again (will be a new one with new shapes) and check the size
        (0, globals_1.expect)(person1.knows.size).toBe(2);
        //then we check the actual graph
        (0, globals_1.expect)(personNode1.getAll(knows).size).toBe(2);
        //the same instance can be expected to be there if you directly added it
        (0, globals_1.expect)(person1.knows.has(person3)).toBe(true);
    });
    (0, globals_1.test)('remove nodes to the graph when you delete a shape from them', function () {
        person1.knows.delete(person3);
        (0, globals_1.expect)(person1.knows.size).toBe(1);
        (0, globals_1.expect)(personNode1.getAll(knows).size).toBe(1);
        //should not occur in the set anymore
        (0, globals_1.expect)(person1.knows.has(person3)).toBe(false);
    });
});
//# sourceMappingURL=shapevaluesset.test.js.map