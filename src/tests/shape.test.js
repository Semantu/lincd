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
var package_js_1 = require("../package.js");
var knows = models_js_1.NamedNode.create();
var person = models_js_1.NamedNode.create();
var advancedPerson = models_js_1.NamedNode.create();
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
var AdvancedPerson = /** @class */ (function (_super) {
    __extends(AdvancedPerson, _super);
    function AdvancedPerson() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AdvancedPerson.targetClass = advancedPerson;
    AdvancedPerson = __decorate([
        package_js_1.linkedShape
    ], AdvancedPerson);
    return AdvancedPerson;
}(Person));
var person1 = new Person();
var person2 = new AdvancedPerson();
(0, globals_1.describe)('Shape', function () {
    (0, globals_1.test)('getLocalInstances returns shapes and subshapes', function () {
        (0, globals_1.expect)(Person.getLocalInstances().size).toBe(2);
    });
});
//# sourceMappingURL=shape.test.js.map