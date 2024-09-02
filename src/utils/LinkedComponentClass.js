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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedComponentClass = void 0;
var react_1 = __importDefault(require("react"));
var models_js_1 = require("../models.js");
/**
 * Extend this class when you want to create a linked component using a classes (instead of a Functional Component).
 * This class extends React.Component.
 * Besides the usual react functionality, it provides extra properties like 'sourceShape' and also automatically rerenders when properties of the source node are changed in the graph.
 *
 * Note that this class needs to be used together with the decorator [@linkedComponentClass](/docs/lincd.js/interfaces/utils_Module.LinkedPackageObject#linkedcomponentclass)
 *
 * It receives 3 type parameters, first the ShapeClass (required) and then the usual props and state types of react.
 * As ShapeClass you will need to provide the same class as you used in the `@linkedComponentClass`.
 *
 * @example
 * Linked component class example:
 * ```tsx
 * import {React} from "react";
 * import {linkedComponentClass} from "../package";
 * impoprt {LinkedComponentClass} from "lincd/utils/ComponentClass";
 * @linkedComponentClass(Person)
 * export class PersonView extends LinkedComponentClass<Person> {
 *   render() {
 *     //typescript knows that person is of type Person
 *     let person = this.props.sourceShape;
 *
 *     //get the name of the person from the graph
 *     return <h1>Hello {person.name}!</h1>;
 *   }
 * }
 * ```
 */
var LinkedComponentClass = /** @class */ (function (_super) {
    __extends(LinkedComponentClass, _super);
    function LinkedComponentClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(LinkedComponentClass.prototype, "sourceShape", {
        get: function () {
            if (typeof this._shape === 'undefined') {
                //not providing a source is allowed
                if (!this.props.source) {
                    this._shape = null;
                }
                else {
                    var shapeClass = this.constructor['shape'];
                    if (!shapeClass) {
                        throw new Error("".concat(this.constructor.name, " is not linked to a shape"));
                    }
                    this._shape = new shapeClass(this.props.source);
                }
            }
            return this._shape;
        },
        enumerable: false,
        configurable: true
    });
    LinkedComponentClass.prototype.componentDidUpdate = function (prevProps, prevState, snapshot) {
        var _this = this;
        if (prevProps.source !== this.props.source &&
            this.props.source instanceof models_js_1.NamedNode) {
            this.props.source.onChangeAny(function (changes, property) {
                console.log('Properties of source ' +
                    _this._shape.toString() +
                    ' changed. Updating.');
                _this.forceUpdate();
            });
        }
    };
    return LinkedComponentClass;
}(react_1.default.Component));
exports.LinkedComponentClass = LinkedComponentClass;
//# sourceMappingURL=LinkedComponentClass.js.map