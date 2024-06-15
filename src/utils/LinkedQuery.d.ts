import { Shape } from '../shapes/Shape.js';
import { TestNode } from './TraceShape.js';
import { PropertyShape } from '../shapes/SHACL.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { CoreSet } from '../collections/CoreSet.js';
import { LinkedComponent, LinkedSetComponent } from './LinkedComponent.js';
import { CoreMap } from '../collections/CoreMap.js';
/**
 * ###################################
 * #### TYPES FOR QUERY BUILDING  ####
 * ###################################
 */
export type JSPrimitive = string | number | boolean | Date | null | undefined;
/**
 * All the possible types that a regular get/set method of a Shape can return
 */
export type AccessorReturnValue = Shape | ShapeSet | JSPrimitive | TestNode;
export type WhereClause<S extends Shape | AccessorReturnValue> = Evaluation | ((s: ToQueryBuilderObject<S>) => Evaluation);
export type QueryBuildFn<T extends Shape, ResponseType> = (p: ToQueryBuilderObject<T>, q: LinkedQuery<T>) => ResponseType;
export type QueryWrapperObject<ShapeType extends Shape = any> = {
    [key: string]: LinkedQuery<ShapeType>;
};
export type CustomQueryObject = {
    [key: string]: QueryPath;
};
export type SelectPath = QueryPath[] | CustomQueryObject;
export type LinkedQueryObject<T extends Shape> = SelectQuery<T>;
export type SubQueryPaths = SelectPath;
/**
 * A QueryPath is an array of QuerySteps, representing the path of properties that were requested to reach a certain value
 */
export type QueryPath = (QueryStep | SubQueryPaths)[] | WherePath;
export type SelectQuery<ShapeType extends Shape> = {
    select: SelectPath;
    where?: WherePath;
    subject?: ShapeType;
    limit?: number;
    offset?: number;
};
/**
 * Much like a querypath, except it can only contain QuerySteps
 */
export type QueryPropertyPath = QueryStep[];
/**
 * A QueryStep is a single step in a query path
 * It contains the property that was requested, and optionally a where clause
 */
export type QueryStep = PropertyQueryStep | SizeStep | CustomQueryObject;
export type SizeStep = {
    count: QueryPropertyPath;
    label?: string;
};
export type PropertyQueryStep = {
    property: PropertyShape;
    where?: WherePath;
};
export type WhereAndOr = {
    firstPath: WherePath;
    andOr: AndOrQueryToken[];
};
/**
 * A WhereQuery is a (sub)query that is used to filter down the results of its parent query
 * Hence it extends LinkedQuery and can do anything a normal query can
 */
export type AndOrQueryToken = {
    and?: WherePath;
    or?: WherePath;
};
export declare enum WhereMethods {
    EQUALS = "eq",
    SOME = "some",
    EVERY = "every"
}
/**
 * Maps all the return types of get/set methods of a Shape and maps their return types to QueryBuilderObjects
 */
export type QueryShapeProps<T extends Shape, Source, Property extends string | number | symbol = any> = {
    [P in keyof T]: ToQueryBuilderObject<T[P], QShape<T, Source, Property>, P>;
};
/**
 * This type states that the ShapeSet has access to the same methods as the shape of all the items in the set
 * (this is enabled with the QueryShapeSet.proxifyShapeSet method)
 * Each value of the shape is converted to a QueryBuilderObject
 */
export type QueryShapeSetProps<SourceShapeSet, Shape> = {
    [P in keyof Shape]: ToQueryBuilderObject<Shape[P], SourceShapeSet, P>;
};
/**
 * ShapeSets are converted to QueryShapeSets, but also inherit all the properties of the shape that each item in the set has (with converted result types)
 */
export type QShapeSet<ShapeSetType extends Shape, Source, Property extends string | number | symbol> = QueryShapeSet<ShapeSetType, Source, Property> & QueryShapeSetProps<QueryShapeSet<ShapeSetType, Source, Property>, ShapeSetType>;
/**
 * Shapes are converted to QueryShapes, but also inherit all the properties of the shape (with converted result types)
 */
export type QShape<T extends Shape, Source, Property extends string | number | symbol = any> = QueryShape<T, Source, Property> & QueryShapeProps<T, Source, Property>;
export type ToQueryBuilderObject<T, Source = null, Property extends string | number | symbol = ''> = T extends ShapeSet<infer ShapeSetType> ? QShapeSet<ShapeSetType, Source, Property> : T extends Shape ? QShape<T, Source, Property> : T extends string ? QueryString<Source, Property> : T extends number ? QueryNumber<Source, Property> : T extends Date ? QueryDate<Source, Property> : T extends boolean ? QueryBoolean : QueryBuilderObject<T>;
export type WherePath = WhereEvaluationPath | WhereAndOr;
export type WhereEvaluationPath = {
    path: QueryPropertyPath;
    method: WhereMethods;
    args: any[];
};
export type ComponentQueryPath = (QueryStep | SubQueryPaths)[] | WherePath;
/**
 * ###################################
 * ####    QUERY RESULT TYPES     ####
 * ###################################
 */
export type NodeResultMap = CoreMap<string, QResult<any, any>>;
export type QResult<ShapeType extends Shape, Object = {}> = Object & {
    id: string;
    shape: ShapeType;
};
export type QueryProps<Q extends LinkedQuery<any>> = Q extends LinkedQuery<infer ShapeType, infer ResponseType> ? QueryResponseToResultType<ResponseType, ShapeType> : never;
export type QueryControllerProps = {
    query?: QueryController;
};
export type QueryController = {
    nextPage: () => void;
    previousPage: () => void;
    setLimit: (limit: number) => void;
    setPage: (page: number) => void;
};
export type PatchedQueryPromise<ResultType, ShapeType extends Shape> = {
    where(validation: WhereClause<ShapeType>): PatchedQueryPromise<ResultType, ShapeType>;
    limit(lim: number): PatchedQueryPromise<ResultType, ShapeType>;
} & Promise<ResultType>;
export type GetCustomObjectKeys<T> = T extends QueryWrapperObject ? {
    [P in keyof T]: T[P] extends LinkedQuery<any> ? ToQueryResultSet<T[P]> : never;
} : [];
export type ToQueryResultSet<T> = T extends LinkedQuery<infer ShapeType, infer ResponseType> ? QueryResponseToResultType<ResponseType, ShapeType>[] : null;
/**
 * MAIN ENTRY to convert the response of a query into a result object
 */
export type QueryResponseToResultType<T, QShapeType extends Shape = null, SourceOverwrite = null> = T extends QueryBuilderObject ? GetQueryObjectResultType<T, {}, SourceOverwrite> : T extends LinkedQuery<any, infer Response, infer Source> ? GetNestedQueryResultType<Response, Source, SourceOverwrite> : T extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : T extends Evaluation ? boolean : T extends Object ? QResult<QShapeType, ObjectToPlainResult<T>> : T;
/**
 * Turns a QueryBuilderObject into a plain JS object
 * @param QV the query value type
 * @param SubProperties to add extra properties into the result object (used to merge arrays into objects for example)
 * @param SourceOverwrite if the source of the query value should be overwritten
 */
export type GetQueryObjectResultType<QV, SubProperties = {}, SourceOverwrite = null> = QV extends QueryString<infer Source, infer Property> ? CreateQResult<GetSource<Source, SourceOverwrite>, string, Property> : QV extends SetSize<infer Source> ? SetSizeToQueryResult<GetSource<Source, SourceOverwrite>> : QV extends QueryNumber<infer Source, infer Property> ? CreateQResult<GetSource<Source, SourceOverwrite>, number, Property> : QV extends QueryDate<infer Source, infer Property> ? CreateQResult<GetSource<Source, SourceOverwrite>, Date, Property> : QV extends QueryShape<infer ShapeType, infer Source, infer Property> ? CreateQResult<GetSource<Source, SourceOverwrite>, ShapeType, Property> : QV extends BoundComponent<infer Source, infer ShapeType> ? GetShapesResultTypeWithSource<Source> : QV extends QueryShapeSet<infer ShapeType, infer Source, infer Property> ? CreateShapeSetQResult<ShapeType, GetSource<Source, SourceOverwrite>, Property, SubProperties> : QV extends Array<infer Type> ? UnionToIntersection<QueryResponseToResultType<Type>> : never;
export type GetShapesResultTypeWithSource<Source> = Source extends QueryShape<infer ShapeType, infer Source, infer Property> ? CreateQResult<Source, ShapeType, Property> : Source extends QueryShapeSet<infer ShapeType, infer Source, infer Property> ? CreateShapeSetQResult<ShapeType, Source, Property> : never;
type GetQueryObjectProperty<T> = T extends QueryBuilderObject<any, any, infer Property> ? Property : never;
type GetQueryObjectOriginal<T> = T extends QueryBuilderObject<infer Original> ? Original : never;
/**
 * Converts an intersection of QueryBuilderObjects into a plain JS object
 * i.e. QueryString<Person,"name"> | QueryString<Person,"hobby"> --> {name: string, hobby: string}
 * To do this we get the Property of each QueryBuilderObject, and use it as the key in the resulting object
 * and, we get the Original type of each QueryBuilderObject, and use it as the value in the resulting object
 */
type QueryValueIntersectionToObject<Items> = {
    [Type in Items as GetQueryObjectProperty<Type>]: GetQueryObjectOriginal<Type>;
};
export type SetSizeToQueryResult<Source> = Source extends QueryShapeSet<infer ShapeType, infer ParentSource, infer SourceProperty> ? CreateQResult<ParentSource, number, SourceProperty> : number;
/**
 * If the source is an object (it extends shape)
 * then the result is a plain JS Object, with Property as its key, with type Value
 */
export type CreateQResult<Source, Value = undefined, Property extends string | number | symbol = '', SubProperties = {}> = Source extends QueryShape<infer SourceShapeType, infer ParentSource, infer SourceProperty> ? ParentSource extends null ? QResult<SourceShapeType, {
    [P in Property]: CreateQResult<Value, Value>;
} & SubProperties> : CreateQResult<ParentSource, QResult<SourceShapeType, {
    [P in Property]: CreateQResult<Value, Value>;
} & SubProperties>, SourceProperty> : Source extends QueryShapeSet<infer ShapeType, infer ParentSource, infer SourceProperty> ? CreateQResult<ParentSource, QResult<ShapeType, {
    [P in Property]: CreateQResult<Value, Value>;
}>[], SourceProperty> : Value extends Shape ? QResult<Value> : Value;
export type CreateShapeSetQResult<ShapeType = undefined, Source = undefined, Property extends string | number | symbol = '', SubProperties = {}> = Source extends QueryShape<infer SourceShapeType> ? QResult<SourceShapeType, {
    [P in Property]: CreateQResult<Source, null, null, SubProperties>[];
}> : Source extends QueryShapeSet<infer ShapeType, infer ParentSource, infer SourceProperty> ? CreateQResult<ParentSource, QResult<ShapeType, {
    [P in Property]: CreateQResult<ShapeType>[];
}>[], SourceProperty> : CreateQResult<ShapeType>;
/**
 * Ignores the source and property, and returns the converted value
 */
export type ObjectToPlainResult<T> = {
    [P in keyof T]: QueryResponseToResultType<T[P], null, true>;
};
export type GetSource<Source, Overwrite> = Overwrite extends null ? Source : Overwrite;
type GetNestedQueryResultType<Response, Source, SourceOverwrite> = Source extends QueryBuilderObject ? GetQueryObjectResultType<GetSource<Source, SourceOverwrite>, ResponseToObject<Response>> : QueryResponseToResultType<Response>[];
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
/**
 * Converts the response of a nested query into a QResult object
 */
type ResponseToObject<R> = R extends Array<infer Type extends QueryBuilderObject> ? QueryValueIntersectionToObject<Type> : ObjectToPlainResult<R>;
export type GetQueryResponseType<Q> = Q extends LinkedQuery<any, infer ResponseType> ? ResponseType : Q;
export type GetQueryShapeType<Q> = Q extends LinkedQuery<infer ShapeType, infer ResponseType> ? ShapeType : never;
export type QueryResponseToEndValues<T> = T extends SetSize ? number[] : T extends LinkedQuery<any, infer Response> ? QueryResponseToEndValues<Response>[] : T extends QueryShapeSet<infer ShapeType> ? ShapeSet<ShapeType> : T extends QueryShape<infer ShapeType> ? ShapeType : T extends QueryString ? string[] : T extends Array<infer ArrType> ? Array<QueryResponseToEndValues<ArrType>> : T extends Evaluation ? boolean[] : T;
/**
 * ###################################
 * ####  QUERY BUILDING CLASSES   ####
 * ###################################
 */
export declare class QueryBuilderObject<OriginalValue = any, Source = any, Property extends string | number | symbol = any> {
    property?: PropertyShape;
    subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet;
    wherePath?: WherePath;
    protected originalValue?: OriginalValue;
    protected source: Source;
    protected prop: Property;
    constructor(property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet);
    /**
     * Converts an original value into a query value
     * @param originalValue
     * @param requestedPropertyShape the property shape that is connected to the get accessor that returned the original value
     */
    static convertOriginal(originalValue: AccessorReturnValue, property: PropertyShape, subject: QueryShape<any> | QueryShapeSet<any> | QueryShape<any>): QueryBuilderObject;
    static getOriginalSource(endValue: ShapeSet<Shape> | Shape[] | QueryPrimitiveSet): ShapeSet;
    static getOriginalSource(endValue: Shape): Shape;
    static getOriginalSource(endValue: QueryString): Shape | string;
    static getOriginalSource(endValue: string[] | QueryBuilderObject): Shape | ShapeSet;
    getOriginalValue(): OriginalValue;
    getPropertyStep(): QueryStep;
    preloadFor<ShapeType extends Shape>(component: LinkedComponent<any, ShapeType> | LinkedSetComponent<any, ShapeType>): BoundComponent<this, ShapeType>;
    limit(lim: number): void;
    /**
     * Returns the path of properties that were requested to reach this value
     */
    getPropertyPath(currentPath?: QueryPropertyPath): QueryPropertyPath;
}
export declare class QueryShapeSet<S extends Shape = Shape, Source = any, Property extends string | number | symbol = any> extends QueryBuilderObject<ShapeSet<S>, Source, Property> {
    queryShapes: CoreSet<QueryShape>;
    private proxy;
    constructor(_originalValue?: ShapeSet<S>, property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any>);
    static create<S extends Shape = Shape>(originalValue: ShapeSet<S>, property: PropertyShape, subject: QueryShape<any> | QueryShapeSet<any>): any;
    static proxifyShapeSet<T extends Shape = Shape>(queryShapeSet: QueryShapeSet<T>): any;
    concat(other: QueryShapeSet): QueryShapeSet;
    filter(filterFn: any): QueryShapeSet;
    setSource(val: boolean): void;
    getOriginalValue(): ShapeSet<S>;
    callPropertyShapeAccessor(propertyShape: PropertyShape): QueryShapeSet | QueryPrimitiveSet;
    size(): SetSize<this>;
    where(validation: WhereClause<S>): this;
    select<QF = unknown>(subQueryFn: QueryBuildFn<S, QF>): LinkedQuery<S, QF, QueryShapeSet<S, Source, Property>>;
    some(validation: WhereClause<S>): SetEvaluation;
    every(validation: WhereClause<S>): SetEvaluation;
    private someOrEvery;
}
export declare class QueryShape<S extends Shape = Shape, Source = any, Property extends string | number | symbol = any> extends QueryBuilderObject<S, Source, Property> {
    originalValue: S;
    isSource: boolean;
    private proxy;
    constructor(originalValue: S, property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any>);
    static create(original: Shape, property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any>): any;
    static proxifyQueryShape<T extends Shape>(queryShape: QueryShape<T>): any;
}
export declare class BoundComponent<Source extends QueryBuilderObject, ShapeType extends Shape> extends QueryBuilderObject {
    originalValue: LinkedComponent<any, ShapeType> | LinkedSetComponent<any, ShapeType>;
    source: Source;
    constructor(originalValue: LinkedComponent<any, ShapeType> | LinkedSetComponent<any, ShapeType>, source: Source);
    getPropertyPath(): QueryPropertyPath;
}
export declare class Evaluation {
    value: QueryBuilderObject | QueryPrimitiveSet;
    method: WhereMethods;
    args: any[];
    private _andOr;
    constructor(value: QueryBuilderObject | QueryPrimitiveSet, method: WhereMethods, args: any[]);
    getPropertyPath(): WherePath;
    getWherePath(): WherePath;
    and(subQuery: WhereClause<any>): this;
    or(subQuery: WhereClause<any>): this;
}
declare class SetEvaluation extends Evaluation {
}
declare class QueryBoolean extends QueryBuilderObject<boolean> {
    constructor(property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any>);
}
/**
 * The class that is used for when JS primitives are converted to a QueryValue
 * This is extended by QueryString, QueryNumber, QueryBoolean, etc
 */
export declare abstract class QueryPrimitive<T, Source = any, Property extends string | number | symbol = any> extends QueryBuilderObject<T, Source, Property> {
    originalValue?: T;
    property?: PropertyShape;
    subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet;
    constructor(originalValue?: T, property?: PropertyShape, subject?: QueryShape<any> | QueryShapeSet<any> | QueryPrimitiveSet);
    equals(otherValue: JSPrimitive): Evaluation;
    where(validation: WhereClause<string>): this;
}
export declare class QueryString<Source = any, Property extends string | number | symbol = ''> extends QueryPrimitive<string, Source, Property> {
}
export declare class QueryDate<Source = any, Property extends string | number | symbol = any> extends QueryPrimitive<Date, Source, Property> {
}
export declare class QueryNumber<Source = any, Property extends string | number | symbol = any> extends QueryPrimitive<number, Source, Property> {
}
export declare class QueryPrimitiveSet<P = any> {
    property?: PropertyShape;
    subject?: QueryShapeSet<any> | QueryShape<any>;
    contents: CoreSet<QueryPrimitive<P>>;
    constructor(property?: PropertyShape, subject?: QueryShapeSet<any> | QueryShape<any>, items?: any);
    add(item: any): void;
    values(): IterableIterator<QueryPrimitive<P, any, any>>;
    createNew(...args: any[]): this;
    equals(other: P): Evaluation;
    getPropertyStep(): QueryStep;
    getPropertyPath(): QueryPropertyPath;
    size(): SetSize<this>;
}
export declare class LinkedQuery<ShapeType extends Shape, ResponseType = any, Source = any> {
    shape: ShapeType;
    private queryBuildFn?;
    private subject?;
    /**
     * The returned value when the query was initially run.
     * Will likely be an array or object or query values that can be used to trace back which methods/accessors were used in the query.
     * @private
     */
    traceResponse: ResponseType;
    parentQueryPath: QueryPath;
    private limit;
    private offset;
    private wherePath;
    constructor(shape: ShapeType, queryBuildFn?: QueryBuildFn<ShapeType, ResponseType>, subject?: ShapeType | ShapeSet<ShapeType>);
    setLimit(limit: number): void;
    getLimit(): number;
    setOffset(offset: number): void;
    getOffset(): number;
    setSubject(subject: any): void;
    where(validation: WhereClause<ShapeType>): this;
    exec(): Promise<QueryResponseToResultType<ResponseType>>;
    getQueryObject(): SelectQuery<ShapeType>;
    /**
     * Returns an array of query paths
     * A single query can request multiple things in multiple "query paths" (For example this is using 2 paths: Shape.select(p => [p.name, p.friends.name]))
     * Each query path is returned as array of the property paths requested, with potential where clauses (together called a QueryStep)
     */
    getQueryPaths(): CustomQueryObject | QueryPath[];
    isValidSetResult(qResults: QResult<any>[]): boolean;
    isValidResult(qResult: QResult<any>): any;
    clone(): LinkedQuery<ShapeType, ResponseType, any>;
    patchResultPromise<ResultType>(p: Promise<ResultType>): PatchedQueryPromise<ResultType, ShapeType>;
    private isValidQueryPathsResult;
    private isValidQueryPathResult;
    private isValidQueryStepResult;
    private isValidCustomObjectResult;
}
export declare class SetSize<Source = null> extends QueryNumber<Source> {
    subject: QueryShapeSet | QueryShape | QueryPrimitiveSet;
    countable?: QueryBuilderObject;
    label?: string;
    constructor(subject: QueryShapeSet | QueryShape | QueryPrimitiveSet, countable?: QueryBuilderObject, label?: string);
    as(label: string): this;
    getPropertyPath(): QueryPropertyPath;
}
/**
 * A sub query that is used to filter results
 * i.e p.friends.where(f => //LinkedWhereQuery here)
 */
export declare class LinkedWhereQuery<S extends Shape, ResponseType = any> extends LinkedQuery<S, ResponseType> {
    getResponse(): Evaluation;
    getWherePath(): WherePath;
}
export {};
