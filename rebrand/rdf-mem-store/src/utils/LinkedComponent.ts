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
} from '../queries/SelectQuery.js';
import {Shape} from '../shapes/Shape.js';

import React, {createElement, useCallback, useEffect, useState} from 'react';
import {LinkedStorage} from '../utils/LinkedStorage.js';
import {DEFAULT_LIMIT} from '../utils/Package.js';
import {NodeSet} from '../collections/NodeSet.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {Node} from '../models.js';
import {getShapeClass, hasSuperClass} from '../utils/ShapeClass.js';

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
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  original?: LinkableComponent<P, ShapeType>;
  query?: SelectQueryFactory<any>; //SelectQuery<any>;
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
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  original?: LinkableSetComponent<P, ShapeType>;
  query?: SelectQueryFactory<any>;

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
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  sources: ShapeSet<ShapeType>;
}

export interface LinkedComponentProps<ShapeType extends Shape>
  extends LinkedComponentBaseProps {
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  source: ShapeType;
  /**
   * @beta
   * Refreshes the data and rerenders the component.
   * WARNING: this prop will likely be replaced in a next version
   */
  _refresh: (updatedProps?: any) => void;
}

interface LinkedComponentBaseProps<DataResultType = any>
  extends React.PropsWithChildren {
  /**
   * Then linkedData will be the result of the data request, if defined.
   * linkedData will either be an array or an object, matching the function defined in this very component
   * See the first parameter of linkedComponent(). If a data request is made with Shape.request()
   * e.g: linkedComponent(Shape.request((shapeInstance) => ...)) then linkedData is defined.
   * If simply a Shape class was given as first parameter, only source will be defined, and linkedData will be undefined.
   */
  linkedData?: DataResultType;
}

export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  /**
   * The primary set of data sources that this component will represent.
   * Can be a set of Nodes in the graph or a set of instances of the Shape that this component uses
   */
  of?: NodeSet | ShapeSet<ShapeType> | QResult<ShapeType>[];
}

export interface LinkedComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
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
    CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps, //this maps all the keys of the result object to props, but only if a QueryWrapperObject was used as query
    ShapeType,
    Res
  >,
) => LinkedSetComponent<CustomProps, ShapeType, Res>;

export type LinkedComponentFactoryFn = <
  QueryType extends SelectQueryFactory<any> = null,
  CustomProps = {},
  ShapeType extends Shape = GetQueryShapeType<QueryType>,
  Response = GetQueryResponseType<QueryType>,
  //the result of a query is always an object.
  //this maps all the keys of the result object to props
  ResultType = QueryResponseToResultType<Response, ShapeType>,
>(
  query: QueryType,
  //The linkable component is the component that the developer will code
  //It receives the custom props (props outside of the linked data props)
  //PLUS the props that are generated by the linked data query
  functionalComponent: LinkableComponent<CustomProps & ResultType, ShapeType>,
  //the result is a LinkedFunctionalComponent is the component that can be used by other components
  //and the props here are only the "custom" props, and NOT the data props
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
        //the result of a query is always an object.
        //this maps all the keys of the result object to props
        QueryResponseToResultType<Res, ShapeType>,
      ShapeType
    >,
  ): LinkedComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query);
    // onQueriesReady(() => {
    //   dataRequest = getDataRequest<ShapeType>(query);
    // });

    //create a new functional component which wraps the original
    //also, first of all use React.forwardRef to support OPTIONAL use of forwardRef by the linked component itself
    //Combining HOC (Linked Component) with forwardRef was tricky to understand and get to work. Inspiration came from: https://dev.to/justincy/using-react-forwardref-and-an-hoc-on-the-same-component-455m
    let _wrappedComponent: LinkedComponent<CustomProps, ShapeType> =
      React.forwardRef<any, CustomProps & LinkedComponentInputProps<ShapeType>>(
        (props, ref) => {
          let [queryResult, setQueryResult] = useState<any>(undefined);
          let [loadingData, setLoadingData] = useState<string>();

          //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
          let linkedProps: any = getLinkedComponentProps<
            ShapeType,
            CustomProps
          >(props as any, shapeClass);
          //if a ref was given, we need to manually add it back to the props, React will extract it and provide is as second argument to React.forwardRef in the linked component itself
          if (ref) {
            linkedProps['ref'] = ref;
          }

          const loadData = () => {
            if (!loadingData || loadingData !== linkedProps.source.node.uri) {
              let requestQuery = (
                actualQuery as SelectQueryFactory<any>
              ).clone();
              if (linkedProps.source) {
                requestQuery.setSubject(linkedProps.source);
              }

              setLoadingData(
                linkedProps.source?.node?.uri ||
                  linkedProps.source?.id ||
                  requestQuery.subject?.node?.uri ||
                  requestQuery.subject?.id,
              );
              Shape.queryParser.selectQuery(requestQuery).then((result) => {
                //store the result to state, this also means we don't need to check cache again.
                setQueryResult(result);
                setLoadingData(null);
              });
            } else {
              console.warn(
                `Already loading data for source ${loadingData}, ignoring request`,
              );
            }
          };

          //check if the given source is a QResult, and not just that, but also if its structure
          //matches the query of this component. (if not, it could be sent as the source but the parent query did not preload the data of this component)
          let sourceIsValidQResult = isValidQResult(props.of, query);

          //if we have loaded the query or the source is a QResult
          if (queryResult || sourceIsValidQResult) {
            //then merge the query result (or the QResult source) directly into the props
            //NOTE: This means all keys of the object become props of the component
            linkedProps = Object.assign(linkedProps, queryResult || props.of);
          }

          //temporary quick fix to allow components to reload after refreshing their data
          //@TODO: A better solutions would likely involve
          //  sA) a new hook, update = useUpdateData(this) <-- need access to the component somehow
          //  then we can do update('status',newValue) and it would update the graph & rerender the component without query refresh
          //  for this it needs to be able to access the property path of the status property of the query
          //  but that also means again that the inner component is bound to the query. Hmm
          //  unless the query leaves a trace inside the linked component, and "this" refers to the linked component which knows which query its bound to
          //  So... it accesses the property path, generates an update query, updates the result state, and hence triggers a rerender
          //  perhaps it will send a temporary isLoading / isUpdating prop
          //  B) source can extend Shape, and Shape no longer refers to triples, but is instead a proxy
          //  when a property of source is updated with source.status = ..., we can update the graph
          //  similar to A), the proxy/shape instance knows its a result of a query and can find back the property path
          //  then triggers a Shape.update() query, and updates the inner state (immediately if possible, except any new ID/URI, so it would use a temporary ID!)
          //  then rerenders again when the update is complete with the URI
          //  C) queries can be combined and refer to each other
          //  so a component can be linked with linkedComponent({
          //    source: Item.query(...)
          //    toggle: Item.update({someProp:...
          //  and then calling source.toggle, or just the prop toggle, would automatically refresh the source
          linkedProps._refresh = useCallback(
            (updatedProps) => {
              //_refresh has the option for the user to provide updated props to prevent a query refresh
              if (updatedProps) {
                //if data was loaded through this component,
                if (queryResult) {
                  // then we can update the result with the new props and prevent a new query
                  setQueryResult({...queryResult, ...updatedProps});
                } else if (sourceIsValidQResult) {
                  //else if the data of this component was provided through the source prop
                  //then we now switch to using the query result, which will win over the source prop
                  setQueryResult({...props.of, ...updatedProps});
                }
              } else {
                loadData();
              }
            },
            [queryResult, props.of],
          );

          // useEffect(() => {
          //   //when receiving new data from the parent
          //   // then we need to reset query result (its possible both are at play do to _refresh with updatedProps, see above)
          //   // so that this component will use the UPDATED props provided by the parent over the internal updated query result
          //   setQueryResult(undefined);
          //   //if the new props are a valid result, then the new props will be used as linked props immediately
          //   //But if it's NOT a valid result, then we also need to load the data again
          //   if(!isValidQResult(props.of,query)) {
          //     loadData();
          //   }
          // },[props.of])

          if (!linkedProps.source && !actualQuery.subject) {
            console.warn(
              'This component requires a source to be provided (use the property "of"): ' +
                functionalComponent.name,
            );
            return null;
          }
          //if we're not using any storage in this LINCD app, don't do any data loading
          let usingStorage = LinkedStorage.isInitialised();

          useEffect(() => {
            //when receiving new data from the parent
            // then we need to reset query result (its possible both are at play do to _refresh with updatedProps, see above)
            // so that this component will use the UPDATED props provided by the parent over the internal updated query result
            if (queryResult) {
              setQueryResult(undefined);
            }

            //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
            if (usingStorage && !sourceIsValidQResult) {
              // let cachedRequest = LinkedStorage.isLoaded(
              //   linkedProps.source.node,
              //   dataRequest,
              // );
              //if these properties were requested before and have finished loading
              // if (cachedRequest === true) {
              //   //then we can set state to loaded straight away
              //   setQueryResult(true);
              // } else if (cachedRequest === false) {
              //if the source/prop.of changed, and
              //if we did not request all these properties before then we continue to load them all
              loadData();
              // } else {
              //   //if some requiredProperties are still being loaded
              //   //cachedResult will be a promise (there is no other return type)
              //   //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
              //   //wait for that loading to be completed and then update the state
              //   cachedRequest.then(() => {
              //     setQueryResult(true);
              //   });
              // }
            }
          }, [linkedProps.source?.node?.uri]);

          //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
          let dataIsLoaded =
            queryResult || !usingStorage || sourceIsValidQResult;

          //But for the first render, when the useEffect has not run yet,
          //and no this is not a bound component (so it's a top level linkedComponent),
          //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
          // if (
          //   typeof queryResult === 'undefined' &&
          //   usingStorage &&
          //   !sourceIsValidQResult
          // ) {
          //   //only continue to render if the result is true (all required data loaded),
          //   // if it's a promise we already deal with that in useEffect()
          //   dataIsLoaded =
          //     LinkedStorage.isLoaded(linkedProps.source.node, dataRequest) ===
          //     true;
          // }

          //if the data is loaded
          //TODO: remove check for typeof window, this is temporary solution to fix hydration errors
          // but really we should find a way to send the data to the frontend for initial page loads AND notify storage that that data is loaded
          // then this check can be turned off. We can possibly do this with RDFA (rdf in html), then we can probably parse the data from the html, whilst rendering it on the server in one go.
          if (dataIsLoaded && typeof window !== 'undefined') {
            // if (dataRequest) {
            //   //TODO: find a way with the new LinkedQuery setup to send the data to the frontend for initial page loads AND then retreive that data here
            //   // const dataResult = await resolveLinkedQuery(
            //   //   requiredData as LinkedQuery<any>,
            //   //   // linkedProps.source,
            //   //   // dataRequest,
            //   //   // pureDataRequest,
            //   // );
            //   // linkedProps = {...linkedProps, dataResult};
            // }

            // //render the original components with the original + generated properties
            return React.createElement(functionalComponent, linkedProps);
          } else {
            //render loading with a proper loading indicator instead of '...'
            return createLoadingSpinner();
          }
        },
      ) as any;

    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    //TODO: turn this on, to do that we need to make dataRequest NOT a promise.
    // to do that we need to move init() more up, queries should perhaps be parsed only after document is loaded
    // but without promise.. with a timeout or callback function. whilst not parsed we should not use them
    // so then dataRequest should not even be accessed and the component should render empty until init is completed
    _wrappedComponent.query = query;

    //link the wrapped functional component to its shape
    _wrappedComponent.shape = shapeClass;
    //IF this component is a function that has a name
    if (functionalComponent.name) {
      //then copy the name (have to do it this way, name is protected)
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      //and add the component class of this module to the global tree
      registerPackageExport(_wrappedComponent);
    }
    //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport

    //register the component and its shape
    registerComponent(_wrappedComponent, shapeClass);

    return _wrappedComponent;
  };
}

export function createLinkedSetComponentFn(
  registerPackageExport,
  registerComponent,
) {
  return function linkedSetComponent<
    QueryType extends SelectQueryFactory<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableSetComponent<
      CustomProps &
        //the result of a query is always an object.
        //this maps all the keys of the result object to props
        QueryResponseToResultType<
          GetQueryResponseType<SelectQueryFactory<ShapeType, Res>>,
          ShapeType
        >,
      ShapeType
    >,
  ): LinkedSetComponent<CustomProps, ShapeType, Res> {
    let [shapeClass, actualQuery] = processQuery<ShapeType>(query, true);

    //if we're not using any storage in this LINCD app, don't do any data loading
    let usingStorage = LinkedStorage.isInitialised();

    //create a new functional component which wraps the original
    let _wrappedComponent: LinkedSetComponent<CustomProps, ShapeType, Res> =
      React.forwardRef<
        any,
        CustomProps & LinkedSetComponentInputProps<ShapeType>
      >((props, ref) => {
        let [queryResult, setQueryResult] = useState<any>(undefined);

        //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
        let linkedProps = getLinkedSetComponentProps<
          ShapeType,
          CustomProps &
            QueryResponseToResultType<
              GetQueryResponseType<SelectQueryFactory<ShapeType, Res>>,
              ShapeType
            >
        >(props, shapeClass, functionalComponent);

        //get the limit from the query,
        // if none, then if no source was given, use the default limit (because then the query will apply to all instances of the shape)
        let defaultLimit = actualQuery.getLimit() || DEFAULT_LIMIT;
        let [limit, setLimit] = useState<number>(defaultLimit);
        let [offset, setOffset] = useState<number>(0);

        //if a ref was given, we need to manually add it back to the props, React will extract it and provide is as second argument to React.forwardRef in the linked component itself
        if (ref) {
          linkedProps['ref'] = ref;
        }

        //check if the given source is a QResult, and not just that, but also if its structure
        //matches the query of this component. (if not, it could be sent as the source but the parent query did not preload the data of this component)
        let sourceIsValidQResult =
          Array.isArray(props.of) &&
          props.of.length > 0 &&
          // (props.of[0] as QResult<any>)?.shape instanceof Shape &&
          typeof (props.of[0] as QResult<any>)?.id === 'string' &&
          actualQuery.isValidSetResult(props.of as QResult<any>[]);

        //if we have loaded the query or the source is a QResult
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
          //if the passed query parameter was a LinkedQuery
          if (query instanceof SelectQueryFactory) {
            //then the results are passed as `linkedData`
            linkedProps = Object.assign(linkedProps, {
              linkedData: dataResult,
            });
          } else {
            //if not: a custom query object was passed, so we pass the results as the name of the first (and only) key of the query object
            let key = Object.keys(query)[0];
            linkedProps[key] = dataResult;
          }
        }

        //if no sources were added, then this query applies to all instances
        //then we add a query control object
        if (limit) {
          linkedProps.query = {
            nextPage: () => {
              setOffset(offset + limit);
            },
            previousPage: () => {
              setOffset(Math.max(0, offset - limit));
            },
            setLimit: (limit: number) => {
              setLimit(limit);
            },
            setPage: (page: number) => {
              setOffset(page * limit);
            },
          } as QueryController;
        }

        useEffect(() => {
          //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
          if (usingStorage && !sourceIsValidQResult) {
            let cachedRequest: boolean = false;
            // LinkedStorage.nodesAreLoaded(
            //   linkedProps.sources?.getNodes(),
            //   dataRequest,
            // );
            //if these properties were requested before and have finished loading
            // if (cachedRequest === true) {
            //we can set state to reflect that
            // debugger;
            // setQueryResult(true);
            // } else if (cachedRequest === false) {
            //if we did not request all these properties before then we continue to load them all
            //load the required PropertyShapes from storage for this specific source
            //we bypass cache because already checked cache ourselves above

            let requestQuery = (actualQuery as SelectQueryFactory<any>).clone();
            requestQuery.setSubject(linkedProps.sources);

            if (limit) {
              requestQuery.setLimit(limit);
            }
            if (offset) {
              requestQuery.setOffset(offset);
            }

            Shape.queryParser.selectQuery(requestQuery).then((result) => {
              //store the result to state, this also means we don't need to check cache again.
              setQueryResult(result);
            });
            // } else {
            //   //if some requiredProperties are still being loaded
            //   //cachedResult will be a promise (there is no other return type)
            //   //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
            //   //wait for that loading to be completed and then update the state
            //   cachedRequest.then(() => {
            //     setQueryResult(true);
            //   });
            // }
          }
          //note: this useEffect function should be re-triggered if a different set of source nodes is given
          //however the actual set could be a new one every time. For now we check the 'of' prop, but if this triggers
          //on every parent update whilst it shouldn't, we could try linkedProps.sources.map(s => s.node.value).join("")
        }, [props.of, limit, offset]);

        //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
        let dataIsLoaded = queryResult || !usingStorage || sourceIsValidQResult;

        //But for the first render, when the useEffect has not run yet,
        //and no this is not a bound component (so it's a top level linkedComponent),
        //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
        if (
          typeof queryResult === 'undefined' &&
          usingStorage &&
          !sourceIsValidQResult
        ) {
          //only continue to render if the result is true (all required data loaded),
          // if it's a promise we already deal with that in useEffect()
          dataIsLoaded = false;
          // LinkedStorage.nodesAreLoaded(
          //   linkedProps.sources?.getNodes(),
          //   dataRequest,
          // ) === true;
        }
        //if the data is loaded
        if (dataIsLoaded) {
          //render the original components with the original + generated properties
          return React.createElement(functionalComponent, linkedProps);
        } else {
          //render loading with a proper loading indicator instead of '...'
          return createLoadingSpinner();
        }
      });

    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    _wrappedComponent.query = query;

    //link the wrapped functional component to its shape
    _wrappedComponent.shape = shapeClass;
    //IF this component is a function that has a name
    if (functionalComponent.name) {
      //then copy the name (have to do it this way, name is protected)
      Object.defineProperty(_wrappedComponent, 'name', {
        value: functionalComponent.name,
      });
      //and add the component class of this module to the global tree
      registerPackageExport(_wrappedComponent);
    }
    //NOTE: if it does NOT have a name, the developer will need to manually use registerPackageExport

    //register the component and its shape
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
    //if a node was given, convert it to a shape instance
    source: getSourceFromInputProps(props, shapeClass),
  };
  //copy over other properties from parent query
  if (newProps['of']) {
    //copy over other props
    for (let key of Object.getOwnPropertyNames(newProps['of'])) {
      if (key !== 'shape' && key !== 'id') {
        newProps[key] = newProps['of'][key];
      }
    }
  }

  delete newProps['of'];
  return newProps;
}

function processQuery<ShapeType extends Shape>(
  requiredData: SelectQueryFactory<ShapeType> | QueryWrapperObject<ShapeType>,
  setComponent: boolean = false,
): ProcessDataResultType<ShapeType> {
  let shapeClass: typeof Shape;
  let query: SelectQueryFactory<ShapeType>;

  //if a Shape class was given (the actual class that extends Shape)
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

/*function getDataRequest<ShapeType extends Shape>(
  requiredData: SelectQueryFactory<ShapeType> | QueryWrapperObject<ShapeType>,
  setComponent: boolean = false,
): Promise<SelectQuery<ShapeType>> {
  let dataRequest: Promise<SelectQuery<ShapeType>>;

  //if a Shape class was given (the actual class that extends Shape)
  if (requiredData instanceof SelectQueryFactory) {
    dataRequest = requiredData.getQueryObject();
  } else if (typeof requiredData === 'object' && setComponent) {
    if (Object.keys(requiredData).length > 1) {
      throw new Error(
        'Only one key is allowed to map a query to a property for linkedSetComponents',
      );
    }
    for (let key in requiredData) {
      if (requiredData[key] instanceof SelectQueryFactory) {
        dataRequest = requiredData[key].getQueryObject();
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
  return dataRequest;
}*/

function getLinkedSetComponentProps<ShapeType extends Shape, P>(
  props: LinkedSetComponentInputProps<ShapeType>,
  shapeClass,
  functionalComponent,
): LinkedSetComponentProps<ShapeType> & P {
  if (
    props.of &&
    !(props.of instanceof NodeSet) &&
    !(props.of instanceof ShapeSet) &&
    !Array.isArray(props.of) &&
    // (props.of as QResult<any>[]).every(
    //   (qResult) => qResult.shape instanceof Shape,
    // ) &&
    !props.of['then']
  ) {
    throw Error(
      "Invalid argument 'of' provided to " +
        functionalComponent.name.replace('_implementation', '') +
        ' component: ' +
        props.of +
        '. Make sure to provide a NodeSet, a ShapeSet or a Promise resolving to either of those. Or no argument at all to load all instances.',
    );
  }

  let sources: ShapeSet<ShapeType>;
  if (props.of instanceof NodeSet) {
    sources = new ShapeSet(
      shapeClass.getSetOf(props.of),
    ) as ShapeSet<ShapeType>;
  } else if (props.of instanceof ShapeSet) {
    sources = props.of;
  } else if (props.of) {
    //QResult[]
    sources = new ShapeSet(
      props.of.map((qResult) => {
        return shapeClass.getFromURI(qResult.id);
      }),
    );
  }
  const newProps = {
    ...props,
    //if a NodeSet was given, convert it to a ShapeSet
    sources,
  };

  delete newProps['of'];
  return newProps as LinkedSetComponentProps<ShapeType> & P;
}

export function getSourceFromInputProps(props, shapeClass) {
  //Support for QResult objects as source input (as 'of' prop)
  if (props.of?.shape instanceof Shape && typeof props.of.id === 'string') {
    return getSourceFromInputProps({of: props.of.shape}, shapeClass);
  }
  return props.of instanceof Node
    ? new shapeClass(props.of)
    : //if it's a shape it needs to match the shape of the component, or extend it, if not we recreate the shape
      props.of instanceof Shape &&
        props.of.nodeShape !== shapeClass.shape.node &&
        !hasSuperClass(getShapeClass(props.of.nodeShape.namedNode), shapeClass)
      ? new shapeClass(props.of.namedNode)
      : props.of;
}

function isValidQResult(of, query) {
  // return (of as QResult<any>)?.shape instanceof Shape &&
  return (
    typeof (of as QResult<any>)?.id === 'string' &&
    query.isValidResult(of as QResult<any>)
  );
}

// function linkedComponentClass<ShapeType extends Shape, P = {}>(
//   shapeClass: typeof Shape,
// ): ClassDecorator {
//   //this is for Components declared with ES Classes
//   //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
//   //class decorators return a function that receives a constructor and returns a constructor.
//   let decoratorFunction = function <T>(constructor) {
//     //add the component class of this module to the global tree
//     registerPackageExport(constructor);
//
//     //link the shape
//     constructor['shape'] = shapeClass;
//
//     //register the component and its shape
//     registerComponent(constructor as any, shapeClass);
//
//     //return the original class without modifications
//     // return constructor;
//
//     //only here we have shapeClass as a value (not in LinkedComponentClass)
//     //so here we can return a new class that extends the original class,
//     //but it adds linked properties like sourceShape
//     let wrappedClass = class extends constructor {
//       constructor(props) {
//         let linkedProps = getLinkedComponentProps<ShapeType, P>(
//           props,
//           shapeClass,
//         );
//         super(linkedProps);
//       }
//     } as any as T;
//     //copy the name
//     Object.defineProperty(wrappedClass, 'name', {value: constructor.name});
//     Object.defineProperty(wrappedClass, 'original', {value: constructor});
//     return wrappedClass;
//   };
//   return decoratorFunction;
// }

// helper function to create a loading indicator
// uses a simple div with class 'ld-loader' that can be styled by the app
function createLoadingSpinner() {
  return React.createElement(
    'div',
    {
      className: 'ld-loader',
      'aria-label': 'Loading',
      role: 'status',
    }
  );
}