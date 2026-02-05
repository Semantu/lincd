/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import nextTick from 'next-tick';
import type {ICoreIterable} from '../interfaces/ICoreIterable.js';
import type {NodeShape, PropertyShape} from './SHACL.js';
import {
  GetQueryResponseType,
  PatchedQueryPromise,
  QResult,
  QShape,
  QueryBuildFn,
  QueryResponseToResultType,
  QueryShape,
  SelectQueryFactory,
} from '../queries/SelectQuery.js';
import type {IQueryParser} from '../interfaces/IQueryParser.js';
import {AddId, NodeReferenceValue, UpdatePartial} from '../queries/QueryFactory.js';
import {CreateResponse} from '../queries/CreateQuery.js';
import {DeleteResponse} from '../queries/DeleteQuery.js';
import {NodeId} from '../queries/MutationQuery.js';
import {getPropertyShapeByLabel} from '../utils/ShapeClass.js';
import {ShapeSet} from '../collections/ShapeSet.js';

//shape that returns property shapes for its keys
type AccessPropertiesShape<T extends Shape> = {
  [P in keyof T]: PropertyShape;
};
type PropertyShapeMapFunction<T extends Shape, ResponseType> = (
  p: AccessPropertiesShape<T>,
) => ResponseType;

export type ShapeType<S extends Shape = Shape> = (abstract new (
  ...args: any[]
) => S) & {
  shape: NodeShape;
  targetClass?: NodeReferenceValue;
};

export abstract class Shape {
  static targetClass: NodeReferenceValue = null;
  static queryParser: IQueryParser;
  static shape: NodeShape;
  static typesToShapes: Map<string, Set<typeof Shape>> = new Map();

  __queryContextId?: string;
  id?: string;

  constructor(node?: string | NodeReferenceValue) {
    if (node) {
      this.id = typeof node === 'string' ? node : node.id;
    }
  }

  get nodeShape(): NodeShape {
    return (this.constructor as typeof Shape).shape;
  }

  get uri(): string {
    return this.id;
  }

  set uri(value: string) {
    this.id = value;
  }

  /**
   * @internal
   * @param shapeClass
   * @param type
   */
  static registerByType(shapeClass: typeof Shape, type?: NodeReferenceValue) {
    if (!type) {
      if (shapeClass === Shape) {
        return;
      }
      const shapeType = shapeClass.targetClass;
      if (shapeType) {
        type = shapeType;
      }
    }
    if (!type) {
      return;
    }
    const typeId = type.id;
    if (!this.typesToShapes.has(typeId)) {
      this.typesToShapes.set(typeId, new Set());
    }
    this.typesToShapes.get(typeId).add(shapeClass);
  }

  static query<S extends Shape, R = unknown>(
    this: {new (...args: any[]): S; targetClass: any},
    subject: S | QShape<S> | QResult<S>,
    queryFn: QueryBuildFn<S, R>,
  ): SelectQueryFactory<S, R>;
  static query<S extends Shape, R = unknown>(
    this: {new (...args: any[]): S; targetClass: any},
    queryFn: QueryBuildFn<S, R>,
  ): SelectQueryFactory<S, R>;
  static query<S extends Shape, R = unknown>(
    this: {new (...args: any[]): S; targetClass: any},
    subject: S | QShape<S> | QResult<S> | QueryBuildFn<S, R>,
    queryFn?: QueryBuildFn<S, R>,
  ): SelectQueryFactory<S, R> {
    const _queryFn =
      subject && queryFn ? queryFn : (subject as QueryBuildFn<S, R>);
    let _subject: S | QResult<S> = queryFn ? (subject as S) : undefined;
    if (_subject instanceof QueryShape) {
      _subject = {id: _subject.id} as QResult<S>;
    }
    const query = new SelectQueryFactory<S>(this as any, _queryFn, _subject);
    return query;
  }

  /**
   * Select properties of instances of this shape.
   * Returns a single result if a single subject is provided, or an array of results if no subjects are provided.
   * The select function (first or second argument) receives a proxy of the shape that allows you to virtually access any property you want up to any level of depth.
   * @param selectFn
   */
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<S, ShapeType>[],
  >(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    selectFn: QueryBuildFn<ShapeType, S>,
  ): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(this: {
    new (...args: any[]): ShapeType;
    queryParser: IQueryParser;
  }): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >,
  >(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    subjects?: ShapeType | QResult<ShapeType>,
    selectFn?: QueryBuildFn<ShapeType, S>,
  ): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    subjects?: ICoreIterable<ShapeType> | QResult<ShapeType>[],
    selectFn?: QueryBuildFn<ShapeType, S>,
  ): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType>;
  static select<
    ShapeType extends Shape,
    S = unknown,
    ResultType = QueryResponseToResultType<
      GetQueryResponseType<SelectQueryFactory<ShapeType, S>>,
      ShapeType
    >[],
  >(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    targetOrSelectFn?: ShapeType | QueryBuildFn<ShapeType, S>,
    selectFn?: QueryBuildFn<ShapeType, S>,
  ): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType> {
    let _selectFn;
    let subject;
    if (selectFn) {
      _selectFn = selectFn;
      subject = targetOrSelectFn;
    } else {
      _selectFn = targetOrSelectFn;
    }

    const query = new SelectQueryFactory<ShapeType, S>(
      this as any,
      _selectFn,
      subject,
    );
    let p = new Promise<ResultType>((resolve, reject) => {
      nextTick(() => {
        this.queryParser
          .selectQuery(query)
          .then((result) => {
            resolve(result as ResultType);
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
    return query.patchResultPromise<ResultType>(p);
  }

  static update<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    id: string | NodeReferenceValue | QShape<ShapeType>,
    updateObjectOrFn?: U,
  ): Promise<AddId<U>> {
    return this.queryParser.updateQuery(
      id,
      updateObjectOrFn,
      this as any as typeof Shape,
    );
  }

  static create<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    updateObjectOrFn?: U,
  ): Promise<CreateResponse<U>> {
    return this.queryParser.createQuery(
      updateObjectOrFn,
      this as any as typeof Shape,
    );
  }

  static delete<ShapeType extends Shape, U extends UpdatePartial<ShapeType>>(
    this: {new (...args: any[]): ShapeType; queryParser: IQueryParser},
    id: NodeId | NodeId[] | NodeReferenceValue[],
  ): Promise<DeleteResponse> {
    return this.queryParser.deleteQuery(id, this as any as typeof Shape);
  }

  static mapPropertyShapes<ShapeType extends Shape, ResponseType = unknown>(
    this: {new (...args: any[]): ShapeType; targetClass: any},
    mapFunction?: PropertyShapeMapFunction<ShapeType, ResponseType>,
  ): ResponseType {
    let dummyShape = new (this as any)();
    dummyShape.proxy = new Proxy(dummyShape, {
      get(target, key, receiver) {
        if (typeof key === 'string') {
          if (key in dummyShape) {
            if (typeof dummyShape[key] === 'function') {
              return target[key].bind(target);
            }
            let propertyShape = getPropertyShapeByLabel(
              dummyShape.constructor,
              key.toString(),
            );
            if (propertyShape) {
              return propertyShape;
            }
            throw new Error(
              `${this.name}.${key.toString()} is missing a @linkedProperty decorator. This method can only access decorated get/set methods.`,
            );
          }
        }
      },
    });
    return mapFunction(dummyShape.proxy);
  }

  static getSetOf<T extends Shape>(
    this: {new (...args: any[]): T},
    values: Iterable<T | NodeReferenceValue | string>,
  ): ShapeSet<T> {
    const set = new ShapeSet<T>();
    for (const value of values) {
      if (value instanceof Shape) {
        set.add(value as T);
      } else {
        const instance = new (this as any)();
        instance.id = typeof value === 'string' ? value : value.id;
        set.add(instance);
      }
    }
    return set;
  }
}
