"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("@jest/globals");
var models_js_1 = require("../models.js");
var subject = models_js_1.NamedNode.create();
var predicate = models_js_1.NamedNode.create();
var value1 = models_js_1.NamedNode.create();
var value2 = models_js_1.NamedNode.create();
(0, globals_1.describe)('node value sets', function () {
    (0, globals_1.test)('can add a value to a node', function () {
        subject.getAll(predicate).add(value1);
        (0, globals_1.expect)(subject.hasProperty(predicate)).toBe(true);
        (0, globals_1.expect)(subject.getAllQuads().length).toBe(1);
    });
    (0, globals_1.test)('can delete a value from a node', function () {
        subject.getAll(predicate).delete(value1);
        (0, globals_1.expect)(subject.hasProperty(predicate)).toBe(false);
        (0, globals_1.expect)(subject.getAllQuads().length).toBe(0);
    });
});
//# sourceMappingURL=nodevaluesset.test.js.map