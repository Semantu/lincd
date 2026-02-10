import {
  GetCustomObjectKeys,
  GetQueryResponseType,
  GetQueryShapeType,
  QResult,
  QueryController,
  QueryControllerProps,
  QueryResponseToResultType,
  QueryWrapperObject,
  SelectQueryFactory,
  ToQueryResultSet,
} from '@_linked/core/queries/SelectQuery';
import {Shape} from '@_linked/core/shapes/Shape';

import React, {createElement, useCallback, useEffect, useState} from 'react';
import {LinkedStorage} from '@_linked/core/utils/LinkedStorage';
import {DEFAULT_LIMIT} from '@_linked/core/utils/Package';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {isNodeReferenceValue, NodeReferenceValue} from '@_linked/core/utils/NodeReference';
import {getShapeClass, hasSuperClass} from '@_linked/core/utils/ShapeClass';

// Kept for parity with legacy source shape processing.
type ProcessDataResultType<ShapeType extends Shape> = [
  typeof Shape,
  SelectQueryFactory<ShapeType>,
];

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | LinkedComponent<P, ShapeType>
  | LinkedSetComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}

export interface LinkedComponent<
  P,
  ShapeType extends Shape = Shape,
  ResultType = any,
> extends React.FC<
    P & LinkedComponentInputProps<ShapeType> & React.ComponentPropsWithRef<any>
  > {
  original?: LinkableComponent<P, ShapeType>;
  query: SelectQueryFactory<any>;
  shape?: typeof Shape;
}

export interface LinkedSetComponent<
  P,
  ShapeType extends Shape = Shape,
  Res = any,
> extends React.FC<
    P &
      LinkedSetComponentInputProps<ShapeType> &
      React.ComponentPropsWithRef<any>
  > {
  original?: LinkableSetComponent<P, ShapeType>;
  query: SelectQueryFactory<any> | QueryWrapperObject<ShapeType>;
  shape?: typeof Shape;
}

export type LinkableComponent<P, ShapeType extends Shape = Shape> = React.FC<
  P & LinkedComponentProps<ShapeType>
>;
export type LinkableSetComponent<
  P,
  ShapeType extends Shape = Shape,
  DataResultType = any,
> = React.FC<LinkedSetComponentProps<ShapeType, DataResultType> & P>;

export interface LinkedSetComponentProps<
  ShapeType extends Shape,
  DataResultType = any,
> extends LinkedComponentBaseProps<DataResultType>,
    QueryControllerProps {
  sources: ShapeSet<ShapeType>;
}

export interface LinkedComponentProps<ShapeType extends Shape>
  extends LinkedComponentBaseProps {
  source: ShapeType;
  _refresh: (updatedProps?: any) => void;
}

interface LinkedComponentBaseProps<DataResultType = any>
  extends React.PropsWithChildren {
  linkedData?: DataResultType;
}

export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  of?: ShapeSet<ShapeType> | QResult<ShapeType>[];
}

export interface LinkedComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  of: NodeReferenceValue | ShapeType | QResult<ShapeType>;
}

interface LinkedComponentInputBaseProps extends React.PropsWithChildren {
  className?: string | string[];
  style?: React.CSSProperties;
}

export type LinkedSetComponentFactoryFn = <
  QueryType extends
    | SelectQueryFactory<any>
    | {[key: string]: SelectQueryFactory<any>} = null,
  CustomProps = {},
  ShapeType extends Shape = GetQueryShapeType<QueryType>,
  Res = ToQueryResultSet<QueryType>,
>(
  requiredData: QueryType,
  functionalComponent: LinkableSetComponent<
    CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps,
    ShapeType,
    Res
  >,
) => LinkedSetComponent<CustomProps, ShapeType, Res>;

export type LinkedComponentFactoryFn = <
  QueryType extends SelectQueryFactory<any> = null,
  CustomProps = {},
  ShapeType extends Shape = GetQueryShapeType<QueryType>,
  Response = GetQueryResponseType<QueryType>,
  ResultType = QueryResponseToResultType<Response, ShapeType>,
>(
  query: QueryType,
  functionalComponent: LinkableComponent<CustomProps & ResultType, ShapeType>,
) => LinkedComponent<CustomProps, ShapeType, ResultType>;

export function createLinkedComponentFn(
  registerPackageExport,
  registerComponent,
) {
  return function linkedComponent<
    QueryType extends SelectQueryFactory<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableComponent<
      CustomProps &
        QueryResponseToResultType<Res, ShapeType>,
      ShapeType
    >,
  ): LinkedComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query);

    let _wrappedComponent: LinkedComponent<CustomProps, ShapeType> =
      React.forwardRef<any, CustomProps & LinkedComponentInputProps<ShapeType>>(
        (props, ref) => {
          let [queryResult, setQueryResult] = useState<any>(undefined);
          let [loadingData, setLoadingData] = useState<string>();

          let linkedProps: any = getLinkedComponentProps<
            ShapeType,
            CustomProps
          >(props as any, shapeClass);
          if (ref) {
            linkedProps.ref = ref;
          }

          const loadData = () => {
            const sourceId = linkedProps.source?.id;
            if (!loadingData || loadingData !== sourceId) {
              let requestQuery = (
                actualQuery as SelectQueryFactory<any>
              ).clone();
              if (linkedProps.source) {
                requestQuery.setSubject(linkedProps.source);
              }

              setLoadingData(sourceId || requestQuery.subject?.id);
              const parser =
                (shapeClass as typeof Shape).queryParser || Shape.queryParser;
              if (!parser) {
                throw new Error(
                  `No query parser configured for ${shapeClass?.name || 'shape'}.`,
                );
              }
              parser.selectQuery(requestQuery).then((result) => {
                setQueryResult(result);
                setLoadingData(null);
              });
            } else {
              console.warn(
                `Already loading data for source ${loadingData}, ignoring request`,
              );
            }
          };

          let sourceIsValidQResult = isValidQResult(props.of, query);

          if (queryResult || sourceIsValidQResult) {
            linkedProps = Object.assign(linkedProps, queryResult || props.of);
          }

          linkedProps._refresh = useCallback(
            (updatedProps) => {
              if (updatedProps) {
                if (queryResult) {
                  setQueryResult({...queryResult, ...updatedProps});
                } else if (sourceIsValidQResult) {
                  setQueryResult({...props.of, ...updatedProps});
                }
              } else {
                loadData();
              }
            },
            [queryResult, props.of],
          );

          if (!linkedProps.source && !actualQuery.subject) {
            console.warn(
              'This component requires a source to be provided (use the property "of"): ' +
                functionalComponent.name,
            );
            return null;
          }

          let usingStorage = LinkedStorage.isInitialised();

          useEffect(() => {
            if (queryResult) {
              setQueryResult(undefined);
            }

            if (usingStorage && !sourceIsValidQResult) {
              loadData();
            }
          }, [linkedProps.source?.id]);

          let dataIsLoaded =
            queryResult || !usingStorage || sourceIsValidQResult;

          // Keep legacy client-side guard to avoid hydration drift.
          if (dataIsLoaded && typeof window !== 'undefined') {
            return React.createElement(functionalComponent, linkedProps);
          } else {
            return createLoadingSpinner();
          }
        },
      ) as any;

    _wrappedComponent.original = functionalComponent;
    _wrappedComponent.query = query;
    _wrappedComponent.shape = shapeClass;
    if (functionalComponent.name) {
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      registerPackageExport(_wrappedComponent);
    }

    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  };
}

export function createLinkedSetComponentFn(
  registerPackageExport,
  registerComponent,
) {
  return function linkedSetComponent<
    QueryType extends
      | SelectQueryFactory<any>
      | {[key: string]: SelectQueryFactory<any>} = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = ToQueryResultSet<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableSetComponent<
      CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps,
      ShapeType
    >,
  ): LinkedSetComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query as any, true);

    let usingStorage = LinkedStorage.isInitialised();

    let _wrappedComponent: LinkedSetComponent<CustomProps, ShapeType, Res> =
      React.forwardRef<
        any,
        CustomProps & LinkedSetComponentInputProps<ShapeType>
      >((props, ref) => {
        let [queryResult, setQueryResult] = useState<any>(undefined);

        let linkedProps = getLinkedSetComponentProps<
          ShapeType,
          any
        >(props, shapeClass, functionalComponent);

        let defaultLimit = actualQuery.getLimit() || DEFAULT_LIMIT;
        let [limit, setLimit] = useState<number>(defaultLimit);
        let [offset, setOffset] = useState<number>(0);

        if (ref) {
          (linkedProps as any).ref = ref;
        }

        let sourceIsValidQResult =
          Array.isArray(props.of) &&
          props.of.length > 0 &&
          typeof (props.of[0] as QResult<any>)?.id === 'string' &&
          actualQuery.isValidSetResult(props.of as QResult<any>[]);

        if (queryResult || sourceIsValidQResult) {
          let dataResult;
          if (queryResult) {
            dataResult = queryResult;
          } else {
            if (limit) {
              dataResult = (props.of as Array<QResult<any>>).slice(
                offset || 0,
                offset + limit,
              );
            } else {
              dataResult = props.of;
            }
          }
          if (query instanceof SelectQueryFactory) {
            linkedProps = Object.assign(linkedProps, {
              linkedData: dataResult,
            });
          } else {
            let key = Object.keys(query)[0];
            linkedProps[key] = dataResult;
          }
        }

        if (limit) {
          linkedProps.query = {
            nextPage: () => {
              setOffset(offset + limit);
            },
            previousPage: () => {
              setOffset(Math.max(0, offset - limit));
            },
            setLimit: (newLimit: number) => {
              setLimit(newLimit);
            },
            setPage: (page: number) => {
              setOffset(page * limit);
            },
          } as QueryController;
        }

        useEffect(() => {
          if (usingStorage && !sourceIsValidQResult) {
            let requestQuery = (actualQuery as SelectQueryFactory<any>).clone();
            requestQuery.setSubject(linkedProps.sources);

            if (limit) {
              requestQuery.setLimit(limit);
            }
            if (offset) {
              requestQuery.setOffset(offset);
            }

            const parser =
              (shapeClass as typeof Shape).queryParser || Shape.queryParser;
            if (!parser) {
              throw new Error(
                `No query parser configured for ${shapeClass?.name || 'shape'}.`,
              );
            }
            parser.selectQuery(requestQuery).then((result) => {
              setQueryResult(result);
            });
          }
        }, [props.of, limit, offset]);

        let dataIsLoaded = queryResult || !usingStorage || sourceIsValidQResult;

        if (
          typeof queryResult === 'undefined' &&
          usingStorage &&
          !sourceIsValidQResult
        ) {
          dataIsLoaded = false;
        }

        if (dataIsLoaded) {
          return React.createElement(functionalComponent, linkedProps);
        } else {
          return createLoadingSpinner();
        }
      }) as any;

    _wrappedComponent.original = functionalComponent;
    _wrappedComponent.query = query;

    _wrappedComponent.shape = shapeClass;
    if (functionalComponent.name) {
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      registerPackageExport(_wrappedComponent);
    }

    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  };
}

function getLinkedComponentProps<ShapeType extends Shape, P>(
  props: LinkedComponentInputProps<ShapeType> & P,
  shapeClass,
): Omit<LinkedComponentProps<ShapeType>, '_refresh'> & P {
  let newProps = {
    ...props,
    source: getSourceFromInputProps(props, shapeClass),
  };

  if (newProps.of) {
    for (let key of Object.getOwnPropertyNames(newProps.of)) {
      if (key !== 'shape' && key !== 'id') {
        newProps[key] = (newProps.of as any)[key];
      }
    }
  }

  delete (newProps as any).of;
  return newProps;
}

function processQuery<ShapeType extends Shape>(
  requiredData: SelectQueryFactory<ShapeType> | QueryWrapperObject<ShapeType>,
  setComponent: boolean = false,
): ProcessDataResultType<ShapeType> {
  let shapeClass: typeof Shape;
  let query: SelectQueryFactory<ShapeType>;

  if (requiredData instanceof SelectQueryFactory) {
    query = requiredData;
    shapeClass = requiredData.shape as any;
  } else if (typeof requiredData === 'object' && setComponent) {
    if (Object.keys(requiredData).length > 1) {
      throw new Error(
        'Only one key is allowed to map a query to a property for linkedSetComponents',
      );
    }
    for (let key in requiredData) {
      if (requiredData[key] instanceof SelectQueryFactory) {
        shapeClass = requiredData[key].shape as any;
        query = requiredData[key];
      } else {
        throw new Error(
          'Unknown value type for query object. Keep to this format: {propName: Shape.query(s => ...)}',
        );
      }
    }
  } else {
    throw new Error(
      'Unknown data query type. Expected a LinkedQuery (from Shape.query()) or an object with 1 key whose value is a LinkedQuery',
    );
  }
  return [shapeClass, query];
}

function getLinkedSetComponentProps<ShapeType extends Shape, P>(
  props: LinkedSetComponentInputProps<ShapeType>,
  shapeClass,
  functionalComponent,
): LinkedSetComponentProps<ShapeType> & P {
  if (
    props.of &&
    !(props.of instanceof ShapeSet) &&
    !Array.isArray(props.of)
  ) {
    throw Error(
      "Invalid argument 'of' provided to " +
        functionalComponent.name.replace('_implementation', '') +
        ' component: ' +
        props.of +
        '. Make sure to provide a ShapeSet, an array of QResults, or no argument at all to load all instances.',
    );
  }

  let sources: ShapeSet<ShapeType>;
  if (props.of instanceof ShapeSet) {
    sources = props.of;
  } else if (Array.isArray(props.of)) {
    sources = new ShapeSet(
      props.of.map((item) => {
        return getSourceFromInputProps({of: item}, shapeClass);
      }),
    );
  }

  const newProps = {
    ...props,
    sources,
  };

  delete (newProps as any).of;
  return newProps as LinkedSetComponentProps<ShapeType> & P;
}

export function getSourceFromInputProps(props, shapeClass) {
  const input = props?.of;

  if (input instanceof Shape) {
    if (
      input.nodeShape !== shapeClass.shape &&
      !hasSuperClass(getShapeClass(input.nodeShape.id), shapeClass)
    ) {
      return new shapeClass(input.id);
    }
    return input;
  }

  if (isNodeReferenceValue(input)) {
    return new shapeClass(input);
  }

  // If nothing is provided, keep undefined; callers handle required source checks.
  return input;
}

function isValidQResult(of, query) {
  return (
    typeof (of as QResult<any>)?.id === 'string' &&
    query.isValidResult(of as QResult<any>)
  );
}

function createLoadingSpinner() {
  return React.createElement(
    'div',
    {
      className: 'ld-loader',
      'aria-label': 'Loading',
      role: 'status',
    },
  );
}
