import {PropertyShape} from '../shapes/PropertyShape.js';
import {Shape} from '../shapes/Shape.js';
import {getPropertyShapeByLabel} from '../utils/ShapeClass.js';

export type QueryPropertyPath = QueryStep[];

export type PropertyQueryStep = {
  property: PropertyShape;
};

export type QueryStep = PropertyQueryStep;

export type SelectQuery<S = Shape> = {
  type: 'select';
  select: QueryPropertyPath[];
  subject?: S;
  limit?: number;
  offset?: number;
  shape?: typeof Shape;
  singleResult?: boolean;
};

export class QueryBuilderObject {
  constructor(
    public property?: PropertyShape,
    public subject?: QueryBuilderObject,
  ) {}

  getPropertyStep(): QueryStep {
    return {
      property: this.property,
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

  static generatePathValue(
    propertyShape: PropertyShape,
    subject: QueryBuilderObject,
  ) {
    if (propertyShape.shape) {
      const shapeClass = propertyShape.shape as typeof Shape;
      return QueryShape.create(new shapeClass(), propertyShape, subject);
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
}

export class SelectQueryFactory<S extends Shape> {
  private traceResponse?: unknown;
  limit?: number;
  offset?: number;
  singleResult?: boolean;

  constructor(
    public shape: typeof Shape,
    private queryBuildFn?: (shape: S) => unknown,
    private subject?: S,
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

  getQueryPaths(): QueryPropertyPath[] {
    const queryPaths: QueryPropertyPath[] = [];
    const response = this.traceResponse;

    if (response instanceof QueryBuilderObject) {
      queryPaths.push(response.getPropertyPath());
    } else if (Array.isArray(response)) {
      response.forEach((endValue) => {
        if (endValue instanceof QueryBuilderObject) {
          queryPaths.push(endValue.getPropertyPath());
        }
      });
    }

    return queryPaths;
  }

  getQueryObject(): SelectQuery<S> {
    const queryPaths = this.getQueryPaths();
    return {
      type: 'select',
      select: queryPaths,
      subject: this.subject,
      limit: this.limit,
      offset: this.offset,
      shape: this.shape,
      singleResult: this.singleResult || !!this.subject,
    } as SelectQuery<S>;
  }
}
