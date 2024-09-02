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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Shape_js_1 = require("../shapes/Shape.js");
var ShapeDecorators_js_1 = require("../utils/ShapeDecorators.js");
var ShapeValuesSet_js_1 = require("../collections/ShapeValuesSet.js");
var models_js_1 = require("../models.js");
var globals_1 = require("@jest/globals");
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
    __decorate([
        (0, ShapeDecorators_js_1.objectProperty)({
            path: knows,
            shape: Person,
            required: true,
        }),
        __metadata("design:type", ShapeValuesSet_js_1.ShapeValuesSet),
        __metadata("design:paramtypes", [])
    ], Person.prototype, "knows", null);
    Person = Person_1 = __decorate([
        package_js_1.linkedShape
    ], Person);
    return Person;
}(Shape_js_1.Shape));
var person1 = new Person();
var person2 = new Person();
var person3 = new Person();
var person4 = new Person();
person1.knows.add(person1);
(0, globals_1.describe)('SHACL nodeshape validation', function () {
    (0, globals_1.test)('can validate reference to same node of same type', function () {
        (0, globals_1.expect)(person1.validate()).toBe(true);
    });
    (0, globals_1.test)('fails when required path is not defined', function () {
        (0, globals_1.expect)(person2.validate()).toBe(false);
    });
    (0, globals_1.test)('still succeeds with circular references', function () {
        person3.knows.add(person4);
        person4.knows.add(person3);
        (0, globals_1.expect)(person3.validate()).toBe(true);
        (0, globals_1.expect)(person4.validate()).toBe(true);
    });
});
//# sourceMappingURL=shacl.test.js.map