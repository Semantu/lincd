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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
var models_js_1 = require("../models.js");
var Shape_js_1 = require("../shapes/Shape.js");
var ShapeSet_js_1 = require("../collections/ShapeSet.js");
var package_js_1 = require("../package.js");
var knows = models_js_1.NamedNode.create();
var person = models_js_1.NamedNode.create();
var Person = /** @class */ (function (_super) {
    __extends(Person, _super);
    function Person() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Person_1 = Person;
    Object.defineProperty(Person.prototype, "knows", {
        get: function () {
            return this.getAllAs(knows, Person_1);
        },
        enumerable: false,
        configurable: true
    });
    var Person_1;
    Person.targetClass = person;
    Person = Person_1 = __decorate([
        package_js_1.linkedShape
    ], Person);
    return Person;
}(Shape_js_1.Shape));
var personNode1 = models_js_1.NamedNode.create();
var personNode2 = models_js_1.NamedNode.create();
var personNode3 = models_js_1.NamedNode.create();
var person1 = new Person(personNode1);
var person1Identical = new Person(personNode1);
var shapeSet = new ShapeSet_js_1.ShapeSet();
(0, globals_1.describe)('shape set', function () {
    (0, globals_1.test)('you can add values to it', function () {
        shapeSet.add(person1);
        (0, globals_1.expect)(shapeSet.size).toBe(1);
    });
    (0, globals_1.test)('you can remove values from it', function () {
        shapeSet.delete(person1);
        (0, globals_1.expect)(shapeSet.size).toBe(0);
    });
    (0, globals_1.test)('you can remove identical shapes from it', function () {
        shapeSet.add(person1);
        shapeSet.delete(person1Identical);
        (0, globals_1.expect)(shapeSet.size).toBe(0);
    });
    (0, globals_1.test)('has returns true for identical shapes', function () {
        shapeSet.add(person1);
        (0, globals_1.expect)(shapeSet.has(person1Identical)).toBe(true);
    });
    (0, globals_1.test)('has returns false for identical shapes if false given as second param', function () {
        shapeSet.add(person1);
        (0, globals_1.expect)(shapeSet.has(person1Identical, false)).toBe(false);
    });
});
//# sourceMappingURL=shapeset.test.js.map