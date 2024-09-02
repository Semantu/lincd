import { GetCustomObjectKeys, GetQueryResponseType, GetQueryShapeType, LinkedQuery, LinkedQueryObject, QResult, QueryControllerProps, QueryResponseToResultType, ToQueryResultSet } from '../utils/LinkedQuery.js';
import { Shape } from '../shapes/Shape.js';
import React from 'react';
import { NodeSet } from '../collections/NodeSet.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { Node } from '../models.js';
export type Component<P = any, ShapeType extends Shape = Shape> = ClassComponent<P, ShapeType> | LinkedComponent<P, ShapeType> | LinkedSetComponent<P, ShapeType>;
export interface ClassComponent<P, ShapeType extends Shape = Shape> extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
    props: P & LinkedComponentProps<ShapeType>;
    shape?: typeof Shape;
}
export interface LinkedComponent<P, ShapeType extends Shape = Shape> extends React.FC<P & LinkedComponentInputProps<ShapeType> & React.ComponentPropsWithRef<any>> {
    /**
     * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
     * @param source the node or shape that this component should visualise
     */
    original?: LinkableComponent<P, ShapeType>;
    query?: LinkedQueryObject<any>;
    shape?: typeof Shape;
}
export interface LinkedSetComponent<P, ShapeType extends Shape = Shape, Res = any> extends React.FC<P & LinkedSetComponentInputProps<ShapeType> & React.ComponentPropsWithRef<any>> {
    /**
     * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
     * @param source the node or shape that this component should visualise
     */
    original?: LinkableSetComponent<P, ShapeType>;
    query?: LinkedQueryObject<any>;
    shape?: typeof Shape;
}
export type LinkableComponent<P, ShapeType extends Shape = Shape> = React.FC<P & LinkedComponentProps<ShapeType>>;
export type LinkableSetComponent<P, ShapeType extends Shape = Shape, DataResultType = any> = React.FC<LinkedSetComponentProps<ShapeType, DataResultType> & P>;
export interface LinkedSetComponentProps<ShapeType extends Shape, DataResultType = any> extends LinkedComponentBaseProps<DataResultType>, QueryControllerProps {
    /**
     * An instance of the Shape that this component is linked to.
     * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
     * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
     */
    sources: ShapeSet<ShapeType>;
}
export interface LinkedComponentProps<ShapeType extends Shape> extends LinkedComponentBaseProps {
    /**
     * An instance of the Shape that this component is linked to.
     * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
     * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
     */
    source: ShapeType;
}
interface LinkedComponentBaseProps<DataResultType = any> extends React.PropsWithChildren {
    /**
     * Then linkedData will be the result of the data request, if defined.
     * linkedData will either be an array or an object, matching the function defined in this very component
     * See the first parameter of linkedComponent(). If a data request is made with Shape.request()
     * e.g: linkedComponent(Shape.request((shapeInstance) => ...)) then linkedData is defined.
     * If simply a Shape class was given as first parameter, only source will be defined, and linkedData will be undefined.
     */
    linkedData?: DataResultType;
}
export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape> extends LinkedComponentInputBaseProps {
    /**
     * The primary set of data sources that this component will represent.
     * Can be a set of Nodes in the graph or a set of instances of the Shape that this component uses
     */
    of?: NodeSet | ShapeSet<ShapeType> | QResult<ShapeType>[];
}
export interface LinkedComponentInputProps<ShapeType extends Shape = Shape> extends LinkedComponentInputBaseProps {
    /**
     * The primary data source that this component will represent.
     * Can be a Node in the graph or an instance of the Shape that this component uses
     */
    of: Node | ShapeType | QResult<ShapeType>;
}
interface LinkedComponentInputBaseProps extends React.PropsWithChildren {
    /**
     * Add class name(s) to the top level DOM element of this component
     * A single class name or an array of classnames. Empty entries are allowed and will be filtered
     * e.g. className={[style.defaultClass,activeState && style.activeClass]}
     */
    className?: string | string[];
    /**
     * Add styles to the top level DOM element of this component
     */
    style?: React.CSSProperties;
}
export type LinkedSetComponentFactoryFn = <QueryType extends LinkedQuery<any> | {
    [key: string]: LinkedQuery<any>;
} = null, CustomProps = {}, ShapeType extends Shape = GetQueryShapeType<QueryType>>(requiredData: QueryType, functionalComponent: LinkableSetComponent<CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps, //this maps all the keys of the result object to props, but only if a QueryWrapperObject was used as query
ShapeType, ToQueryResultSet<QueryType>>) => LinkedSetComponent<CustomProps, ShapeType>;
export type LinkedComponentFactoryFn = <QueryType extends LinkedQuery<any> = null, CustomProps = {}, ShapeType extends Shape = GetQueryShapeType<QueryType>, Res = GetQueryResponseType<QueryType>>(query: QueryType, functionalComponent: LinkableComponent<CustomProps & QueryResponseToResultType<GetQueryResponseType<LinkedQuery<ShapeType, Res>>, ShapeType>, ShapeType>) => LinkedComponent<CustomProps, ShapeType>;
export declare function createLinkedComponentFn(registerPackageExport: any, registerComponent: any): <QueryType extends LinkedQuery<any, any, any> = null, CustomProps = {}, ShapeType extends Shape = GetQueryShapeType<QueryType>, Res = GetQueryResponseType<QueryType>>(query: QueryType, functionalComponent: LinkableComponent<CustomProps & QueryResponseToResultType<GetQueryResponseType<LinkedQuery<ShapeType, Res>>, ShapeType>, ShapeType>) => LinkedComponent<CustomProps, ShapeType>;
export declare function createLinkedSetComponentFn(registerPackageExport: any, registerComponent: any): <QueryType extends LinkedQuery<any, any, any> = null, CustomProps = {}, ShapeType extends Shape = GetQueryShapeType<QueryType>, Res = GetQueryResponseType<QueryType>>(query: QueryType, functionalComponent: LinkableSetComponent<CustomProps & QueryResponseToResultType<GetQueryResponseType<LinkedQuery<ShapeType, Res>>, ShapeType>, ShapeType>) => LinkedSetComponent<CustomProps, ShapeType, Res>;
export declare function getSourceFromInputProps(props: any, shapeClass: any): any;
export {};
