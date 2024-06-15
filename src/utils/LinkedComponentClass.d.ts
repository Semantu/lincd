import React from 'react';
import { Shape } from '../shapes/Shape.js';
import { LinkedComponentProps } from './LinkedComponent.js';
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
export declare class LinkedComponentClass<ShapeClass extends Shape, P = {}, S = any> extends React.Component<P & LinkedComponentProps<ShapeClass>, S> {
    private _shape;
    get sourceShape(): ShapeClass;
    componentDidUpdate(prevProps: Readonly<P & LinkedComponentProps<ShapeClass>>, prevState: Readonly<S>, snapshot?: any): void;
}
