import {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';
import {getPropertyShapeByLabel} from '../utils/ShapeClass.js';

export type JSNonNullPrimitive = string | number | boolean | Date;
export type JSPrimitive = JSNonNullPrimitive | null | undefined;

export type SingleResult<ResultType> =
  ResultType extends Array<infer R>
    ? R
    : ResultType extends Set<infer R>
      ? R
      : ResultType;

export type CustomQueryObject = {[key: string]: QueryPath};

export type QueryPath =
  | QueryStep[]
  | QueryPropertyPath
  | WherePath
  | CustomQueryObject
  | QueryPath[];

export type QueryPropertyPath = QueryStep[];

export type PropertyQueryStep = {
  property: PropertyShape;
  where?: WherePath;
};

export type SizeStep = {
  count: QueryPropertyPath;
  label?: string;
};

export type QueryStep = PropertyQueryStep | SizeStep;

export type WhereAndOr = {
  firstPath: WherePath;
  andOr: AndOrQueryToken[];
};

export type AndOrQueryToken = {
  and?: WherePath;
  or?: WherePath;
};

export enum WhereMethods {
  EQUALS = '=',
  SOME = 'some',
  EVERY = 'every',
}

export type WherePath = WhereEvaluationPath | WhereAndOr;

export type WhereEvaluationPath = {
  path: QueryPropertyPath;
  method: WhereMethods;
  args: QueryArg[];
};

export type QueryArg = {id: string} | JSNonNullPrimitive | WherePath;

export type SortByPath = {
  paths: QueryPath[] | CustomQueryObject;
  direction: string;
};

export type SelectQuery<S = Shape> = {
  type: 'select';
  select: QueryPath[];
  sortBy?: SortByPath;
  subject?: S | QResult<S>;
  limit?: number;
  offset?: number;
  shape?: typeof Shape;
  singleResult?: boolean;
  where?: WherePath;
};

export type QResult<ShapeType = Shape, Object = {}> = Object & {
  id: string;
};

export type QueryBuildFn<T extends Shape, ResponseType> = (
  p: QShape<T>,
  q?: SelectQueryFactory<T>,
) => ResponseType;

export type QueryShapeProps<
  T extends Shape,
  Source,
  Property extends string | number | symbol = any,
> = {
  [P in keyof T]: ToQueryBuilderObject<T[P], QShape<T, Source, Property>, P>;
};

export type QueryShapeSetProps<SourceShapeSet, ShapeType> = {
  [P in keyof ShapeType]: ToQueryBuilderObject<ShapeType[P], SourceShapeSet, P>;
};

export type QShapeSet<
  ShapeType extends Shape,
  Source = null,
  Property extends string | number | symbol = null,
> = QueryShapeSet<ShapeType, Source, Property> &
  QueryShapeSetProps<
    QueryShapeSet<ShapeType, Source, Property>,
    ShapeType
  >;

export type QShape<
  T extends Shape,
  Source = any,
  Property extends string | number | symbol = any,
> = QueryShape<T, Source, Property> & QueryShapeProps<T, Source, Property>;

export type ToQueryBuilderObject<
  T,
  Source = null,
  Property extends string | number | symbol = '',
> = T extends Shape
  ? QShape<T, Source, Property>
  : T extends JSNonNullPrimitive
    ? QueryPrimitive<T, Source, Property>
    : T extends Array<infer AT>
      ? AT extends Shape
        ? QShapeSet<AT, Source, Property>
        : AT extends JSNonNullPrimitive
          ? QueryPrimitiveSet<QueryPrimitive<AT, Source, Property>>
          : QueryBuilderObject<T, Source, Property>
      : QueryBuilderObject<T, Source, Property>;

export type PatchedQueryPromise<ResultType, ShapeType extends Shape> = {
  where?(
    validation: (shape: ShapeType) => Evaluation | WhereBuilder,
  ): PatchedQueryPromise<ResultType, ShapeType>;
  limit?(lim: number): PatchedQueryPromise<ResultType, ShapeType>;
  sortBy?(
    sortParam: any,
    direction?: 'ASC' | 'DESC',
  ): PatchedQueryPromise<ResultType, ShapeType>;
  one?(): PatchedQueryPromise<SingleResult<ResultType>, ShapeType>;
} & Promise<ResultType>;

export type QueryResponseToResultType<
  T,
  QShapeType extends Shape = Shape,
  HasName = false,
> = T extends QueryBuilderObject
  ? GetQueryObjectResultType<T, {}, false, HasName>
  : T extends SelectQueryFactory<any, infer Response, infer Source>
    ? GetNestedQueryResultType<Response, Source>
    : T extends Array<infer Type>
      ? UnionToIntersection<QueryResponseToResultType<Type>>
      : T extends Evaluation
        ? boolean
        : T extends Object
          ? QResult<QShapeType, Prettify<ObjectToPlainResult<T>>>
          : never;

export type GetQueryResponseType<Q> =
  Q extends SelectQueryFactory<any, infer ResponseType> ? ResponseType : Q;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

type Prettify<T> = {[K in keyof T]: T[K]} & {};

type GetNestedQueryResultType<Response, Source> =
  Source extends QueryBuilderObject
    ? GetQueryObjectResultType<Source, QueryResponseToResultType<Response>>
    : QueryResponseToResultType<Response>[];

type QueryValueIntersectionToObject<QueryValue> =
  QueryValue extends QueryBuilderObject
    ? GetQueryObjectResultType<QueryValue>
    : never;

type ResponseToObject<R> =
  R extends Array<infer Type extends QueryBuilderObject>
    ? QueryValueIntersectionToObject<Type>
    : Prettify<ObjectToPlainResult<R>>;

type ObjectToPlainResult<T> = {
  [P in keyof T]: QueryResponseToResultType<T[P], null, true>;
};

type CreateQResult<
  Source,
  Value,
  Property extends string | number | symbol = any,
  SubProperties = {},
  HasName = false,
> = Source extends QueryBuilderObject
  ? QResult<
      GetSourceShape<Source>,
      (Property extends null
        ? {}
        : {
            [P in Property as HasName extends true ? `${P & string}` : P]:
              Value;
          }) &
        SubProperties
    >
  : Value;

type CreateShapeSetQResult<
  ShapeType extends Shape,
  Source,
  Property extends string | number | symbol = any,
  SubProperties = {},
  HasName = false,
> = CreateQResult<
  Source,
  QResult<ShapeType, SubProperties>[],
  Property,
  {},
  HasName
>;

type GetSourceShape<Source> =
  Source extends QueryShape<infer ShapeType, any, any> ? ShapeType : Shape;

type GetQueryObjectResultType<
  QV,
  SubProperties = {},
  PrimitiveArray = false,
  HasName = false,
> = QV extends SetSize<infer Source>
  ? CreateQResult<Source, number, null, SubProperties, HasName>
  : QV extends QueryPrimitive<infer Primitive, infer Source, infer Property>
    ? CreateQResult<
        Source,
        PrimitiveArray extends true ? Primitive[] : Primitive,
        Property,
        {},
        HasName
      >
    : QV extends QueryShape<infer ShapeType, infer Source, infer Property>
      ? CreateQResult<Source, ShapeType, Property, SubProperties, HasName>
      : QV extends QueryShapeSet<infer ShapeType, infer Source, infer Property>
        ? CreateShapeSetQResult<
            ShapeType,
            Source,
            Property,
            SubProperties,
            HasName
          >
        : QV extends QueryPrimitiveSet<infer QPrimitive>
          ? GetQueryObjectResultType<QPrimitive, SubProperties, true, HasName>
          : SubProperties;

export class QueryBuilderObject<
  OriginalValue = any,
  Source = any,
  Property extends string | number | symbol = any,
> {
  wherePath?: WherePath;

  constructor(
    public property?: PropertyShape,
    public subject?: QueryBuilderObject,
  ) {}

  getPropertyStep(): QueryStep {
    return {
      property: this.property,
      where: this.wherePath,
    };
  }

  getPropertyPath(currentPath?: QueryPropertyPath): QueryPropertyPath {
    const path: QueryPropertyPath = currentPath ? [...currentPath] : [];
    if (this.property) {
      path.unshift(this.getPropertyStep());
    }
    if (this.subject) {
      return this.subject.getPropertyPath(path);
    }
    return path;
  }

  equals(value: QueryArg): Evaluation {
    return new Evaluation({
      path: this.getPropertyPath(),
      method: WhereMethods.EQUALS,
      args: [value],
    });
  }

  where(validation: (value: QueryBuilderObject) => Evaluation | WhereBuilder): this {
    this.wherePath = processWhereClause(validation, this);
    return this;
  }

  static generatePathValue(
    propertyShape: PropertyShape,
    subject: QueryBuilderObject,
  ) {
    if (propertyShape.valueShapeClass || typeof propertyShape.shape === 'function') {
      const shapeClass =
        propertyShape.valueShapeClass ||
        (propertyShape.shape as unknown as typeof Shape);
      if (propertyShape.maxCount === 1) {
        return QueryShape.create(new shapeClass(), propertyShape, subject);
      }
      return QueryShapeSet.create(new shapeClass(), propertyShape, subject);
    }
    return new QueryValue(propertyShape, subject);
  }
}

export class QueryPrimitive<
  T,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<T, Source, Property> {}

export class QueryString<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<string, Source, Property> {}

export class QueryNumber<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<number, Source, Property> {}

export class QueryBoolean<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<boolean, Source, Property> {}

export class QueryDate<
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryPrimitive<Date, Source, Property> {}

export class QueryPrimitiveSet<
  QPrimitive extends QueryPrimitive<any> = QueryPrimitive<any>,
> extends QueryBuilderObject {
  constructor(
    public property?: PropertyShape,
    public subject?: QueryBuilderObject,
  ) {
    super(property, subject);
  }

  size() {
    return new SetSize(this);
  }
}

export class QueryValue extends QueryPrimitive<any, any, any> {}

export class QueryShape<
  S extends Shape = Shape,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<S, Source, Property> {
  private proxy: QueryShape;

  constructor(
    public originalValue: Shape,
    property?: PropertyShape,
    subject?: QueryBuilderObject,
  ) {
    super(property, subject);
  }

  static create(
    original: Shape,
    property?: PropertyShape,
    subject?: QueryBuilderObject,
  ) {
    const instance = new QueryShape(original, property, subject);
    return this.proxifyQueryShape(instance);
  }

  private static proxifyQueryShape<T extends Shape>(queryShape: QueryShape) {
    queryShape.proxy = new Proxy(queryShape, {
      get(target, key) {
        if (typeof key === 'string') {
          if (key in queryShape) {
            const value = (target as any)[key];
            return typeof value === 'function' ? value.bind(target) : value;
          }

          const propertyShape = getPropertyShapeByLabel(
            queryShape.originalValue.constructor as typeof Shape,
            key,
          );
          if (propertyShape) {
            return QueryBuilderObject.generatePathValue(propertyShape, target);
          }
        }
        return undefined;
      },
    });
    return queryShape.proxy;
  }

  select<Response>(selectFn: QueryBuildFn<S, Response>) {
    return new SelectQueryFactory(
      this.originalValue.constructor as {new (): S},
      selectFn,
      undefined,
      this.getPropertyPath(),
    );
  }

  as(shapeClass: typeof Shape) {
    return QueryShape.create(new shapeClass(), this.property, this.subject);
  }
}

export class QueryShapeSet<
  S extends Shape = Shape,
  Source = any,
  Property extends string | number | symbol = any,
> extends QueryBuilderObject<S, Source, Property> {
  private proxy: QueryShapeSet;

  constructor(
    public originalValue: Shape,
    property?: PropertyShape,
    subject?: QueryBuilderObject,
  ) {
    super(property, subject);
  }

  static create(
    original: Shape,
    property?: PropertyShape,
    subject?: QueryBuilderObject,
  ) {
    const instance = new QueryShapeSet(original, property, subject);
    return this.proxifyQueryShapeSet(instance);
  }

  private static proxifyQueryShapeSet(queryShape: QueryShapeSet) {
    queryShape.proxy = new Proxy(queryShape, {
      get(target, key) {
        if (typeof key === 'string') {
          if (key in queryShape) {
            const value = (target as any)[key];
            return typeof value === 'function' ? value.bind(target) : value;
          }

          const propertyShape = getPropertyShapeByLabel(
            queryShape.originalValue.constructor as typeof Shape,
            key,
          );
          if (propertyShape) {
            return QueryBuilderObject.generatePathValue(propertyShape, target);
          }
        }
        return undefined;
      },
    });
    return queryShape.proxy;
  }

  some(
    validation: (shape: QueryBuilderObject) => Evaluation | WhereBuilder,
  ): Evaluation {
    return new Evaluation({
      path: this.getPropertyPath(),
      method: WhereMethods.SOME,
      args: [processWhereClause(validation, this.proxy)],
    });
  }

  every(
    validation: (shape: QueryBuilderObject) => Evaluation | WhereBuilder,
  ): Evaluation {
    return new Evaluation({
      path: this.getPropertyPath(),
      method: WhereMethods.EVERY,
      args: [processWhereClause(validation, this.proxy)],
    });
  }

  where(validation: (value: QueryBuilderObject) => Evaluation | WhereBuilder): this {
    this.wherePath = processWhereClause(validation, this.proxy);
    return this;
  }

  select<Response>(selectFn: QueryBuildFn<S, Response>) {
    return new SelectQueryFactory(
      this.originalValue.constructor as {new (): S},
      selectFn,
      undefined,
      this.getPropertyPath(),
    );
  }

  as(shapeClass: typeof Shape) {
    return QueryShapeSet.create(new shapeClass(), this.property, this.subject);
  }

  size() {
    return new SetSize(this);
  }
}

export class SetSize<Source = null> extends QueryNumber<Source> {
  constructor(
    public subject: QueryShapeSet | QueryShape | QueryPrimitiveSet,
    public countable?: QueryBuilderObject,
    public label?: string,
  ) {
    super();
  }

  as(label: string) {
    this.label = label;
    return this;
  }

  getPropertyPath(): QueryPropertyPath {
    const countable = this.subject.getPropertyStep();
    const self: SizeStep = {
      count: [countable],
      label: this.label || this.subject.property?.label,
    };
    if ((this.subject as QueryBuilderObject).subject) {
      const path = (this.subject as QueryBuilderObject).subject.getPropertyPath();
      path.push(self);
      return path;
    }
    return [self];
  }
}

export class WhereBuilder {
  constructor(
    public firstPath: WherePath,
    public andOr: AndOrQueryToken[] = [],
  ) {}

  and(path: Evaluation | WhereBuilder) {
    this.andOr.push({and: getWherePath(path)});
    return this;
  }

  or(path: Evaluation | WhereBuilder) {
    this.andOr.push({or: getWherePath(path)});
    return this;
  }

  getWherePath(): WhereAndOr {
    return {
      firstPath: this.firstPath,
      andOr: this.andOr,
    };
  }
}

export class Evaluation {
  constructor(private wherePath: WherePath) {}

  and(path: Evaluation | WhereBuilder) {
    return new WhereBuilder(this.wherePath).and(path);
  }

  or(path: Evaluation | WhereBuilder) {
    return new WhereBuilder(this.wherePath).or(path);
  }

  getWherePath() {
    return this.wherePath;
  }
}

const getWherePath = (path: Evaluation | WhereBuilder) =>
  path instanceof WhereBuilder ? path.getWherePath() : path.getWherePath();

const processWhereClause = (
  validation: (value: QueryBuilderObject) => Evaluation | WhereBuilder,
  subject: QueryBuilderObject,
): WherePath => {
  const result = validation(subject);
  return getWherePath(result);
};

export class SelectQueryFactory<S extends Shape, ResponseType = any, Source = any> {
  private traceResponse?: ResponseType;
  limit?: number;
  offset?: number;
  singleResult?: boolean;
  private wherePath?: WherePath;
  private sortResponse?: unknown;
  private sortDirection?: string;

  constructor(
    public shape: {new (): S},
    private queryBuildFn?: QueryBuildFn<S, ResponseType>,
    private subject?: S,
    private parentQueryPath?: QueryPropertyPath,
  ) {
    this.traceResponse = this.getQueryShape();
  }

  private getQueryShape(): ResponseType {
    if (!this.queryBuildFn) {
      return undefined;
    }
    const dummyShape = new this.shape() as S;
    const queryShape =
      QueryShape.create(dummyShape) as unknown as QShape<S>;
    return this.queryBuildFn(queryShape, this);
  }

  getQueryPaths(
    response: ResponseType = this.traceResponse,
  ): QueryPath[] | CustomQueryObject {
    let queryPaths: QueryPath[] = [];
    let queryObject: CustomQueryObject | undefined;

    if (response instanceof QueryBuilderObject || response instanceof SetSize) {
      queryPaths.push(response.getPropertyPath());
    } else if (Array.isArray(response)) {
      response.forEach((endValue) => {
        if (endValue instanceof QueryBuilderObject) {
          queryPaths.push(endValue.getPropertyPath());
        } else if (endValue instanceof SetSize) {
          queryPaths.push(endValue.getPropertyPath());
        } else if (endValue instanceof SelectQueryFactory) {
          queryPaths.push(endValue.getQueryPaths() as unknown as QueryPath);
        }
      });
    } else if (response instanceof Evaluation || response instanceof WhereBuilder) {
      queryPaths.push(getWherePath(response));
    } else if (response instanceof SelectQueryFactory) {
      queryPaths.push(response.getQueryPaths() as unknown as QueryPath);
    } else if (typeof response === 'object' && response) {
      queryObject = {};
      Object.getOwnPropertyNames(response).forEach((key) => {
        const value = response[key];
        if (value instanceof QueryBuilderObject) {
          queryObject[key] = value.getPropertyPath();
        } else if (value instanceof SetSize) {
          queryObject[key] = value.getPropertyPath();
        } else if (value instanceof Evaluation || value instanceof WhereBuilder) {
          queryObject[key] = getWherePath(value);
        } else {
          throw new Error(`Unknown trace response type for key ${key}`);
        }
      });
    }

    if (this.parentQueryPath) {
      queryPaths = [
        ...(this.parentQueryPath as unknown as QueryPath[]),
        (queryObject ?? queryPaths) as QueryPath,
      ];
      queryObject = undefined;
    }

    return queryObject ?? queryPaths;
  }

  getQueryObject(): SelectQuery<S> {
    const queryPaths = this.getQueryPaths();
    return {
      type: 'select',
      select: Array.isArray(queryPaths) ? queryPaths : [queryPaths],
      sortBy: this.getSortByPath(),
      subject: this.subject,
      limit: this.limit,
      offset: this.offset,
      shape: this.shape as unknown as typeof Shape,
      singleResult: this.singleResult || !!this.subject,
      where: this.wherePath,
    } as SelectQuery<S>;
  }

  where(validation: (shape: S) => Evaluation | WhereBuilder) {
    const dummyShape = new this.shape() as S;
    const queryShape = QueryShape.create(dummyShape);
    this.wherePath = processWhereClause(
      validation as unknown as (
        value: QueryBuilderObject,
      ) => Evaluation | WhereBuilder,
      queryShape,
    );
    return this;
  }

  sortBy<R>(sortFn: (shape: S) => R, direction = 'ASC') {
    const dummyShape = new this.shape() as S;
    const queryShape = QueryShape.create(dummyShape);
    if (sortFn) {
      this.sortResponse = sortFn(queryShape as unknown as S);
      this.sortDirection = direction;
    }
    return this;
  }

  setLimit(limit: number) {
    this.limit = limit;
    return this;
  }

  patchResultPromise<ResultType>(
    promise: Promise<ResultType>,
  ): PatchedQueryPromise<ResultType, S> {
    const patched = promise as PatchedQueryPromise<ResultType, S>;
    patched.where = (validation) => {
      this.where(validation);
      return patched;
    };
    patched.limit = (limit) => {
      this.setLimit(limit);
      return patched;
    };
    patched.sortBy = (sortFn, direction) => {
      this.sortBy(sortFn, direction);
      return patched;
    };
    patched.one = () => {
      this.setLimit(1);
      this.singleResult = true;
      return patched as PatchedQueryPromise<SingleResult<ResultType>, S>;
    };
    return patched;
  }

  private getSortByPath() {
    if (!this.sortResponse) {
      return undefined;
    }
    return {
      paths: this.getQueryPaths(this.sortResponse as ResponseType),
      direction: this.sortDirection || 'ASC',
    };
  }
}
