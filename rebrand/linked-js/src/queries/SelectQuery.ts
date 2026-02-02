import {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';
import {getPropertyShapeByLabel} from '../utils/ShapeClass.js';

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

export type QueryArg = {id: string} | string | number | boolean | Date | WherePath;

export type SortByPath = {
  paths: QueryPath[] | CustomQueryObject;
  direction: string;
};

export type SelectQuery<S = Shape> = {
  type: 'select';
  select: QueryPath[];
  sortBy?: SortByPath;
  subject?: S;
  limit?: number;
  offset?: number;
  shape?: typeof Shape;
  singleResult?: boolean;
  where?: WherePath;
};

export type QResult<ShapeType extends Shape = Shape, Object = {}> = Object & {
  id: string;
};

export class QueryBuilderObject {
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

export class QueryValue extends QueryBuilderObject {}

export class QueryShape extends QueryBuilderObject {
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

  select<Response>(selectFn: (shape: Shape) => Response) {
    return new SelectQueryFactory(
      this.originalValue.constructor as typeof Shape,
      selectFn,
      undefined,
      this.getPropertyPath(),
    );
  }

  as(shapeClass: typeof Shape) {
    return QueryShape.create(new shapeClass(), this.property, this.subject);
  }
}

export class QueryShapeSet extends QueryBuilderObject {
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

  some(validation: (shape: Shape) => Evaluation | WhereBuilder): Evaluation {
    return new Evaluation({
      path: this.getPropertyPath(),
      method: WhereMethods.SOME,
      args: [processWhereClause(validation, this.proxy)],
    });
  }

  every(validation: (shape: Shape) => Evaluation | WhereBuilder): Evaluation {
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

  select<Response>(selectFn: (shape: Shape) => Response) {
    return new SelectQueryFactory(
      this.originalValue.constructor as typeof Shape,
      selectFn,
      undefined,
      this.getPropertyPath(),
    );
  }

  as(shapeClass: typeof Shape) {
    return QueryShapeSet.create(new shapeClass(), this.property, this.subject);
  }

  size() {
    return new QueryCount(this);
  }
}

export class QueryCount {
  constructor(private source: QueryBuilderObject) {}

  getPropertyPath(): QueryPropertyPath {
    return [
      {
        count: this.source.getPropertyPath(),
      },
    ];
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

export class SelectQueryFactory<S extends Shape> {
  private traceResponse?: unknown;
  limit?: number;
  offset?: number;
  singleResult?: boolean;
  private wherePath?: WherePath;
  private sortResponse?: unknown;
  private sortDirection?: string;

  constructor(
    public shape: typeof Shape,
    private queryBuildFn?: (shape: S) => unknown,
    private subject?: S,
    private parentQueryPath?: QueryPropertyPath,
  ) {
    this.traceResponse = this.getQueryShape();
  }

  private getQueryShape() {
    if (!this.queryBuildFn) {
      return undefined;
    }
    const dummyShape = new (this.shape as typeof Shape)() as S;
    const queryShape = QueryShape.create(dummyShape);
    return this.queryBuildFn(queryShape as unknown as S);
  }

  getQueryPaths(response = this.traceResponse): QueryPath[] | CustomQueryObject {
    let queryPaths: QueryPath[] = [];
    let queryObject: CustomQueryObject | undefined;

    if (
      response instanceof QueryBuilderObject ||
      response instanceof QueryCount
    ) {
      queryPaths.push(response.getPropertyPath());
    } else if (Array.isArray(response)) {
      response.forEach((endValue) => {
        if (endValue instanceof QueryBuilderObject) {
          queryPaths.push(endValue.getPropertyPath());
        } else if (endValue instanceof QueryCount) {
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
        } else if (value instanceof QueryCount) {
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
      shape: this.shape,
      singleResult: this.singleResult || !!this.subject,
      where: this.wherePath,
    } as SelectQuery<S>;
  }

  where(validation: (shape: S) => Evaluation | WhereBuilder) {
    const dummyShape = new (this.shape as typeof Shape)() as S;
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
    const dummyShape = new (this.shape as typeof Shape)() as S;
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

  patchResultPromise<ResultType>(promise: Promise<ResultType>) {
    const patched = promise as Promise<ResultType> & {
      where?: (validation: (shape: S) => Evaluation | WhereBuilder) => typeof patched;
      limit?: (limit: number) => typeof patched;
      one?: () => typeof patched;
      sortBy?: (sortFn: (shape: S) => unknown, direction?: string) => typeof patched;
    };
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
      return patched;
    };
    return patched;
  }

  private getSortByPath() {
    if (!this.sortResponse) {
      return undefined;
    }
    return {
      paths: this.getQueryPaths(this.sortResponse),
      direction: this.sortDirection || 'ASC',
    };
  }
}
