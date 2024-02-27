/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode, Node} from '../models';
import {NodeShape, PropertyShape} from '../shapes/SHACL';
import {Shape} from '../shapes/Shape';
import {Prefix} from './Prefix';
import React, {createElement, useEffect, useState} from 'react';
import {CoreSet} from '../collections/CoreSet';
import {NodeSet} from '../collections/NodeSet';
import {ShapeSet} from '../collections/ShapeSet';
import {
  BoundComponentFactory,
  BoundComponentProps,
  BoundSetComponentFactory,
  Component,
  LinkableFunctionalComponent,
  LinkableFunctionalSetComponent,
  LinkedComponentInputProps,
  LinkedComponentProps,
  LinkedDataChildRequestFn,
  LinkedDataDeclaration,
  LinkedDataGenericQuery,
  LinkedDataRequest,
  LinkedDataRequestFn,
  LinkedDataResponse,
  LinkedDataSetDeclaration,
  LinkedFunctionalComponent,
  LinkedFunctionalSetComponent,
  LinkedSetComponentInputProps,
  LinkedSetComponentProps,
  removeBoundComponents,
  TransformedLinkedDataResponse,
} from '../interfaces/Component';
import {lincd as lincdOntology} from '../ontologies/lincd';
import {npm} from '../ontologies/npm';
import {rdf} from '../ontologies/rdf';
import {LinkedStorage} from './LinkedStorage';
import {URI} from './URI';
import {
  addNodeShapeToShapeClass,
  getShapeClass,
  hasSuperClass,
} from './ShapeClass';
import {
  BoundComponent,
  ComponentQueryPath,
  CustomQueryObject,
  GetCustomObjectKeys,
  GetQueryResponseType,
  GetQueryShapeType,
  LinkedQuery,
  QResult,
  QueryBuilderObject,
  QueryController,
  QueryControllerProps,
  QueryPath,
  QueryPropertyPath,
  QueryResponseToResultType,
  QueryShape,
  QueryStep,
  QueryWrapperObject,
  SelectQuery,
  ToQueryResultSet,
} from './LinkedQuery';
import {createTraceShape, TraceShape} from './TraceShape';
import {resolveLocalEndResults} from './LocalQueryResolver';
import {QueryType} from 'typedoc';

//global tree
declare var lincd: any;
declare var window;
declare var global;

export const LINCD_DATA_ROOT: string = 'https://data.lincd.org/';

// var packageParsePromises: Map<string,Promise<any>> = new Map();
// var loadedPackages: Set<NamedNode> = new Set();
let shapeToComponents: Map<typeof Shape, CoreSet<Component>> = new Map();
let ontologies: Set<any> = new Set();
let _autoLoadOntologyData = false;
/**
 * a map of requested property shapes for specific nodes
 * The value is a promise if it's still loading, or true if it is fully loaded
 */
type ClassDecorator = <T extends {new (...args: any[]): {}}>(
  constructor: T,
) => T;

/**
 * This object, returned by [linkedPackage()](/docs/lincd.js/modules/utils_Module#linkedPackage),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedPackageObject {
  /**
   * Class decorator that links a class-based component to its shape.
   * Once linked, the component receives an extra property "sourceShape" which will be an instance of the linked Shape.
   *
   * Note that your class needs to extend [LinkedComponentClass](/docs/lincd.js/classes/utils_LinkedComponentClass.LinkedComponentClass), which extends React.Component.
   * And you will need to provide the same Shape class that you use as a parameter for the decorator as a type generic to LinkedComponentClass (see example).
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   *
   * @example
   * Linked component class example:
   * ```tsx
   * import {React} from "react";
   * import {linkedComponentClass} from "../package";
   * import {LinkedComponentClass} from "lincd/lib/utils/ComponentClass";
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
  linkedComponentClass: <ShapeType extends Shape, P = {}>(
    shapeClass: typeof Shape,
  ) => ClassDecorator;
  /**
   * Links a typescript class to a SHACL shape.
   * This decorator creates a SHACL shape and looks at the static property [targetClass](/docs/lincd.js/classes/shapes_Shape.Shape#targetclass)
   * The rest of the shape is typically 'shaped' by methods that use [property decorators](/docs/lincd.js/modules/utils_ShapeDecorators).
   *
   * @example
   * Example of a typescript class using the \@linkedShape decorator:
   * ```tsx
   * @linkedShape
   * export class Person extends Shape {
   *   /**
   *    * indicates that instances of this shape need to have this rdf.type
   *    *\/
   *   static targetClass: NamedNode = schema.Person;
   *
   *   /**
   *    * indicates that instances of this shape need to have this rdf.type
   *    *\/
   *   @literalProperty({
   *     path: schema.givenName,
   *     required: true,
   *     maxCount: 1,
   *   })
   *   get name() {
   *     return this.getValue(schema.givenName);
   *   }
   *
   *   set name(val: string) {
   *     this.overwrite(schema.givenName, new Literal(val));
   *   }
   * }
   * ```
   */
  linkedShape: <T extends typeof Shape>(constructor: T) => T;
  /**
   * Use this decorator to make any other classes or functions available on demand to other LINCD modules.
   * It does not change the object it is applied on.
   * This is specifically required for their use in an open-ended LINCD application.
   *
   * @example
   * An example helper utility using the \@linkedUtil decorator:
   * ```tsx
   * @linkedUtil
   * export class Sort {
   *   static byName(persons:Person[]) {
   *     return persons.sort((p1,p2) => p1.name < p2.name ? -1 : 1)
   *   }
   * ```
   */
  linkedUtil: (constructor: any) => any;
  /**
   * Used to notify LINCD.js of an ontology.
   * See also the [Ontology guides](/docs/guides/linked-code/ontologies).
   *
   * @param allFileExports - all the objects that are exported by the ontology file (use `import * as _this from "./path-to-this-file")`)
   * @param nameSpace - the result of [createNameSpace](/docs/lincd.js/modules/utils_NameSpace#createnamespace). This allows consumers to generate NamedNodes that may not be listed in this ontology if needed
   * @param prefixAndFileName - a suggested prefix chosen by you. Make sure the suggestedPrefix matches the file name and the name of the exported object that groups all entities together
   * @param loadDataFunction - a method that loads _and parses_ the raw ontology data. This means the ontology will be loaded into the local graph. The returned result is mostly a JSONLDParsePromise (from lincd-jsonld/lib/JSONLD, not bundled in LINCD.js)
   * @param dataSource - the relative path to the raw data of the ontology
   * @example
   * Example of an Ontology File that used linkedOntology()
   * ```tsx
   * import {NamedNode} from 'lincd/lib/models';
   * import {JSONLD} from 'lincd-jsonld/lib/JSONLD';
   * import {createNameSpace} from 'lincd/lib/utils/NameSpace';
   * import {linkedOntology} from '../package';
   * import * as _this from './my-ontology';
   *
   * let dataFile = '../data/my-ontology.json';
   * export var loadData = () => JSONLD.parsePromise(import(dataFile));
   *
   * export var ns = createNameSpace('http://www.my-ontology.com/');
   *
   * export var _self: NamedNode = ns('');
   *
   * // Classes
   * export var ExampleClass: NamedNode = ns('ExampleClass');
   *
   * // Properties
   * export var exampleProperty: NamedNode = ns('exampleProperty');
   *
   * export const myOntology = {
   *   ExampleClass,
   *   exampleProperty,
   * };
   *
   * linkedOntology(_this, ns, 'myOntology', loadData, dataFile);
   * ```
   */
  linkedOntology: (
    allFileExports,
    nameSpace: (term: string) => NamedNode,
    suggestedPrefixAndFileName: string,
    loadDataFunction?: () => Promise<any>,
    dataSource?: string | string[],
  ) => void;
  /**
   * Low level method used by other decorators to write to the modules' object in the LINCD tree.
   * You should typically not need this.
   * @param exportFileName - the file name that this exported object is available under. Needs to be unique across the module.
   * @param exportedObject - the exported object (the class, constant, function, etc)
   */
  registerPackageExport: (exportedObject: any) => void;
  /**
   * A reference to the modules' object in the LINCD tree.
   * Contains all linked components of the module.
   */
  packageExports: any;
  packageName: string;

  /**
   * Links a functional component to its shape
   * Once linked, the component receives an extra property "sourceShape" which will be an instance of the linked Shape.
   *
   * Note that the shape needs to be provided twice, as a type and as a value, see examples below.
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   * @param functionalComponent - a functional rect component
   *
   * @example
   * Linked Functional Component example:
   * ```tsx
   * import {Person} from "../shapes/Person";
   * export const PersonView = linkedComponent<Person>(Person, ({source, sourceShape}) => {
   *   //source is a NamedNode, and sourceShape is an instance of Person (for the same named node)
   *   let person = sourceShape;
   *   //get the name of the person from the graph
   *   return <h1>Hello {person.name}!</h1>;
   * });
   * ```
   */
  linkedComponent<
    QueryType extends LinkedQuery<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
    // ShapeType extends Shape = any,
    // Res = unknown,
  >(
    requiredData: QueryType,
    //The linkable component is the component that the developer will code
    //It receives the custom props (props outside of the linked data props)
    //PLUS the props that are generated by the linked data query
    functionalComponent: LinkableFunctionalComponent<
      CustomProps &
        //the result of a query is always an object.
        //this maps all the keys of the result object to props
        QueryResponseToResultType<
          GetQueryResponseType<LinkedQuery<ShapeType, Res>>,
          ShapeType
        >,
      ShapeType
    >,
    //the result is a LinkedFunctionalComponent is the component that can be used by other components
    //and the props here are only the "custom" props, and NOT the data props
  ): LinkedFunctionalComponent<CustomProps, ShapeType>;

  /**
   * Links a functional Set component to its shape
   * Set components are components that show a set of data sources.
   * Once linked, the component receives an extra property "sources" which will be a ShapeSet with instance of the linked Shape.
   *
   * Note that the shape needs to be provided twice, as a type and as a value, see examples below.
   * @param shape - the Shape class that this component is linked to. Import a LINCD Shape class and use this class directly for this parameter
   * @param functionalComponent - a functional react component
   *
   * @example
   * Linked Functional Set Component example:
   * ```tsx
   * import {Person} from "../shapes/Person";
   * export const PersonView = linkedSetComponent<Person>(Person, ({sources}) => {
   *   //source is a NamedNode, and sourceShape is an instance of Person (for the same named node)
   *   let persons = sources;
   *   //get the name of the person from the graph
   *   return <div>{persons.map(person => <p>{person.name}</p>)}</div>;
   * });
   * ```
   */
  linkedSetComponent<
    QueryType extends
      | LinkedQuery<any>
      | {[key: string]: LinkedQuery<any>} = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
  >(
    requiredData: QueryType,
    functionalComponent: LinkableFunctionalSetComponent<
      CustomProps & GetCustomObjectKeys<QueryType> & QueryControllerProps, //this maps all the keys of the result object to props, but only if a QueryWrapperObject was used as query
      ShapeType,
      ToQueryResultSet<QueryType>
    >,
  ): LinkedFunctionalSetComponent<CustomProps, ShapeType>;

  /**
   * Register a file (a javascript module) and all its exported objects.
   * Specifically helpful for registering multiple functional components if you declare them without a function name
   * @param _this
   * @param _module
   */
  registerPackageModule(_module): void;
}

/**
 *  Convert some node to a prefixed format:
 * - http://some-example.org/prop > ex:prop
 *  */
const prefix = (n) => Prefix.toPrefixed(n.uri);

export var DEFAULT_LIMIT = 12;
export function setDefaultPageLimit(limit: number) {
  DEFAULT_LIMIT = limit;
}

export function autoLoadOntologyData(value: boolean) {
  _autoLoadOntologyData = value;
  //this may be set to true after some ontologies have already indexed,
  if (_autoLoadOntologyData) {
    // so in that case we load all data of ontologies that are already indexed
    ontologies.forEach((ontologyExport) => {
      //see linkedOntology() where we store the data loading method under the _load key
      if (ontologyExport['_load']) {
        ontologyExport['_load']();
      }
    });
  }
}

function dataRequestToGenericQuery(
  shapeType: typeof Shape,
  dataRequest: LinkedDataRequest,
  subject?: Shape | ShapeSet,
) {
  let genericQuery: LinkedDataGenericQuery;

  let where: [string, string, string][];
  if (!subject) {
    where = [['?s', prefix(rdf.type), prefix(shapeType.targetClass)]];
  } else if (subject instanceof Shape) {
    where = [['?s', '@id', subject.uri]];
  } else {
    // ShapeSet
  }

  genericQuery = {
    select: dataRequest,
    where,
  };

  return genericQuery;
}

export function linkedPackage(packageName: string): LinkedPackageObject {
  let packageNode = NamedNode.getOrCreate(
    `${LINCD_DATA_ROOT}module/${packageName}`,
    true,
  );
  packageNode.set(rdf.type, lincdOntology.Module);
  packageNode.setValue(npm.packageName, packageName);

  let packageTreeObject = registerPackageInTree(packageName);

  //#Create declarators for this module
  let registerPackageExport = function (object) {
    if (object.name in packageTreeObject) {
      console.warn(
        `Key ${object.name} was already defined for package ${packageName}. Note that LINCD currently only supports unique names across your entire package. Overwriting ${object.name} with new value`,
      );
    }
    packageTreeObject[object.name] = object;
  };

  let registerInPackageTree = function (exportName, exportedObject) {
    packageTreeObject[exportName] = exportedObject;
  };

  function registerPackageModule(_module): void {
    for (var key in _module.exports) {
      //if the exported object itself (usually FunctionalComponents) is not named or its name is _wrappedComponent (which ends up happening in the linkedComponent method above)
      //then we give it the same name as it's export name.
      if (
        !_module.exports[key].name ||
        _module.exports[key].name === '_wrappedComponent'
      ) {
        Object.defineProperty(_module.exports[key], 'name', {value: key});
        //manual 'hack' to set the name of the original function
        if (
          _module.exports[key]['original'] &&
          !_module.exports[key]['original']['name']
        ) {
          Object.defineProperty(_module.exports[key]['original'], 'name', {
            value: key + '_implementation',
          });
        }
      }
      registerInPackageTree(key, _module.exports[key]);
    }
  }

  //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
  let linkedUtil = function (constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //return the original class without modifications
    return constructor;
  };

  //method to create a linked functional component
  function linkedComponent<
    QueryType extends LinkedQuery<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
  >(
    query: QueryType,
    // requiredData:
    //   | typeof Shape
    //   | LinkedDataDeclaration<ShapeType>
    //   | LinkedQuery<ShapeType, Res>,
    functionalComponent: LinkableFunctionalComponent<
      CustomProps &
        //the result of a query is always an object.
        //this maps all the keys of the result object to props
        QueryResponseToResultType<
          GetQueryResponseType<LinkedQuery<ShapeType, Res>>,
          ShapeType
        >,
      ShapeType
    >,
  ): LinkedFunctionalComponent<CustomProps, ShapeType> {
    let [shapeClass, dataRequest, actualQuery] =
      processDataDeclaration<ShapeType>(query);

    //create a new functional component which wraps the original
    //also, first of all use React.forwardRef to support OPTIONAL use of forwardRef by the linked component itself
    //Combining HOC (Linked Component) with forwardRef was tricky to understand and get to work. Inspiration came from: https://dev.to/justincy/using-react-forwardref-and-an-hoc-on-the-same-component-455m
    let _wrappedComponent: LinkedFunctionalComponent<CustomProps, ShapeType> =
      React.forwardRef<
        any,
        CustomProps & LinkedComponentInputProps<ShapeType> & BoundComponentProps
      >((props, ref) => {
        let [queryResult, setQueryResult] = useState<any>(undefined);

        //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
        let linkedProps: any = getLinkedComponentProps<ShapeType, CustomProps>(
          props,
          shapeClass,
        );
        //if a ref was given, we need to manually add it back to the props, React will extract it and provide is as second argument to React.forwardRef in the linked component itself
        if (ref) {
          linkedProps['ref'] = ref;
        }
        //check if the given source is a QResult, and not just that, but also if its structure
        //matches the query of this component. (if not, it could be sent as the source but the parent query did not preload the data of this component)
        let sourceIsValidQResult =
          (props.of as QResult<any>)?.shape instanceof Shape &&
          typeof (props.of as QResult<any>)?.id === 'string' &&
          query.isValidResult(props.of as QResult<any>);

        //if we have loaded the query or the source is a QResult
        if (queryResult || sourceIsValidQResult) {
          //then merge the query result (or the QResult source) directly into the props
          //NOTE: This means all keys of the object become props of the component
          linkedProps = Object.assign(linkedProps, queryResult || props.of);
        }

        if (!linkedProps.source) {
          console.warn(
            'No source provided to this component: ' + functionalComponent.name,
          );
          return null;
        }
        //if we're not using any storage in this LINCD app, don't do any data loading
        let usingStorage = LinkedStorage.isInitialised();

        useEffect(() => {
          //if this property is not bound (if this component is bound we can expect all properties to be loaded by the time it renders)
          if (!props.isBound && usingStorage && !sourceIsValidQResult) {
            let cachedRequest = LinkedStorage.isLoaded(
              linkedProps.source.node,
              dataRequest,
            );
            //if these properties were requested before and have finished loading
            if (cachedRequest === true) {
              //then we can set state to loaded straight away
              setQueryResult(true);
            } else if (cachedRequest === false) {
              //if we did not request all these properties before then we continue to
              // load the required PropertyShapes from storage for this specific source

              let requestQuery = (actualQuery as LinkedQuery<any>).clone();
              requestQuery.setSubject(linkedProps.source);

              LinkedStorage.query(requestQuery).then((result) => {
                //store the result to state, this also means we don't need to check cache again.
                setQueryResult(result);
              });
            } else {
              //if some requiredProperties are still being loaded
              //cachedResult will be a promise (there is no other return type)
              //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
              //wait for that loading to be completed and then update the state
              cachedRequest.then(() => {
                setQueryResult(true);
              });
            }
          }
        }, [linkedProps.source.node, props.isBound]);

        //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
        let dataIsLoaded =
          props.isBound || queryResult || !usingStorage || sourceIsValidQResult;

        //But for the first render, when the useEffect has not run yet,
        //and no this is not a bound component (so it's a top level linkedComponent),
        //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
        if (
          !props.isBound &&
          typeof queryResult === 'undefined' &&
          usingStorage &&
          !sourceIsValidQResult
        ) {
          //only continue to render if the result is true (all required data loaded),
          // if it's a promise we already deal with that in useEffect()
          dataIsLoaded =
            LinkedStorage.isLoaded(linkedProps.source.node, dataRequest) ===
            true;
        }

        //if the data is loaded
        //TODO: remove check for typeof window, this is temporary solution to fix hydration errors
        // but really we should find a way to send the data to the frontend for initial page loads AND notify storage that that data is loaded
        // then this check can be turned off. We can possibly do this with RDFA (rdf in html), then we can probably parse the data from the html, whilst rendering it on the server in one go.
        if (dataIsLoaded && typeof window !== 'undefined') {
          if (dataRequest) {
            //TODO: find a way with the new LinkedQuery setup to send the data to the frontend for initial page loads AND then retreive that data here
            // const dataResult = await resolveLinkedQuery(
            //   requiredData as LinkedQuery<any>,
            //   // linkedProps.source,
            //   // dataRequest,
            //   // pureDataRequest,
            // );
            // linkedProps = {...linkedProps, dataResult};
          }

          // //render the original components with the original + generated properties
          return React.createElement(functionalComponent, linkedProps);
        } else {
          //render loading
          return createElement('div', null, '...');
        }
      }) as any;

    //connect the Component.of() function, which is called bindComponentToData here
    //<DeclaredProps & LinkedComponentInputProps<ShapeType>, ShapeType>
    _wrappedComponent.of = bindComponentToData.bind(_wrappedComponent);

    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    _wrappedComponent.query = dataRequest;

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
  }

  function linkedSetComponent<
    QueryType extends LinkedQuery<any> = null,
    CustomProps = {},
    ShapeType extends Shape = GetQueryShapeType<QueryType>,
    Res = GetQueryResponseType<QueryType>,
  >(
    query: QueryType,
    functionalComponent: LinkableFunctionalSetComponent<
      CustomProps, //this maps all the keys of the result object to props //the result of a query is always an object.
      ShapeType,
      QueryResponseToResultType<
        GetQueryResponseType<LinkedQuery<ShapeType, Res>>,
        ShapeType
      >[]
    >,
  ): LinkedFunctionalSetComponent<CustomProps, ShapeType> {
    let [shapeClass, dataRequest, actualQuery] =
      processDataDeclaration<ShapeType>(query, true);

    //if we're not using any storage in this LINCD app, don't do any data loading
    let usingStorage = LinkedStorage.isInitialised();

    //create a new functional component which wraps the original
    let _wrappedComponent: LinkedFunctionalSetComponent<
      CustomProps,
      ShapeType
    > = React.forwardRef<
      any,
      CustomProps &
        LinkedSetComponentInputProps<ShapeType> &
        BoundComponentProps
    >((props, ref) => {
      let [queryResult, setQueryResult] = useState<any>(undefined);

      //take the given props and add make sure 'of' is converted to 'source' (an instance of the shape)
      let linkedProps = getLinkedSetComponentProps<ShapeType, CustomProps>(
        props,
        shapeClass,
        functionalComponent,
      );

      //get the limit from the query,
      // if none, then if no source was given, use the default limit (because then the query will apply to all instances of the shape)
      let defaultLimit =
        actualQuery.getLimit() ||
        (!linkedProps.sources ? DEFAULT_LIMIT : undefined);
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
        (props.of[0] as QResult<any>)?.shape instanceof Shape &&
        typeof (props.of[0] as QResult<any>)?.id === 'string' &&
        actualQuery.isValidSetResult(props.of as QResult<any>[]);

      //if we have loaded the query or the source is a QResult
      if (queryResult || sourceIsValidQResult) {
        //if the passed query parameter was a LinkedQuery
        if (query instanceof LinkedQuery) {
          //then the results are passed as `linkedData`
          linkedProps = Object.assign(linkedProps, {
            linkedData: queryResult || props.of,
          });
        } else {
          //if not: a custom query object was passed, so we pass the results as the name of the first (and only) key of the query object
          let key = Object.keys(query)[0];
          linkedProps[key] = queryResult || props.of;
        }
      }

      //if no sources were added, then this query applies to all instances
      //then we add a query control object
      if (!linkedProps.sources) {
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
        if (!props.isBound && usingStorage && !sourceIsValidQResult) {
          let cachedRequest = LinkedStorage.nodesAreLoaded(
            linkedProps.sources?.getNodes(),
            dataRequest,
          );
          //if these properties were requested before and have finished loading
          if (cachedRequest === true) {
            //we can set state to reflect that
            debugger;
            setQueryResult(true);
          } else if (cachedRequest === false) {
            //if we did not request all these properties before then we continue to load them all
            //load the required PropertyShapes from storage for this specific source
            //we bypass cache because already checked cache ourselves above

            let requestQuery = (actualQuery as LinkedQuery<any>).clone();
            requestQuery.setSubject(linkedProps.sources);

            if (limit) {
              requestQuery.setLimit(limit);
            }
            if (offset) {
              requestQuery.setOffset(offset);
            }

            LinkedStorage.query(requestQuery).then((result) => {
              //store the result to state, this also means we don't need to check cache again.
              setQueryResult(result);
            });
          } else {
            //if some requiredProperties are still being loaded
            //cachedResult will be a promise (there is no other return type)
            //(this may happen when a different component already requested the same properties for the same source just before this sibling component)
            //wait for that loading to be completed and then update the state
            cachedRequest.then(() => {
              setQueryResult(true);
            });
          }
        }
        //note: this useEffect function should be re-triggered if a different set of source nodes is given
        //however the actual set could be a new one every time. For now we check the 'of' prop, but if this triggers
        //on every parent update whilst it shouldn't, we could try linkedProps.sources.map(s => s.node.value).join("")
      }, [props.of, props.isBound, limit, offset]);

      //we can assume data is loaded if this is a bound component or if the isLoaded state has been set to true
      let dataIsLoaded =
        props.isBound || queryResult || !usingStorage || sourceIsValidQResult;

      //But for the first render, when the useEffect has not run yet,
      //and no this is not a bound component (so it's a top level linkedComponent),
      //then we still need to manually check cache to avoid a rendering a temporary load icon until useEffect has run (in the case the data is already loaded)
      if (
        !props.isBound &&
        typeof queryResult === 'undefined' &&
        usingStorage &&
        !sourceIsValidQResult
      ) {
        //only continue to render if the result is true (all required data loaded),
        // if it's a promise we already deal with that in useEffect()
        dataIsLoaded =
          LinkedStorage.nodesAreLoaded(
            linkedProps.sources?.getNodes(),
            dataRequest,
          ) === true;
      }
      //if the data is loaded
      if (dataIsLoaded) {
        //render the original components with the original + generated properties
        return React.createElement(functionalComponent, linkedProps);
      } else {
        //render loading
        return createElement('div', null, '...');
      }
    });

    //attach the 'of(source)' function. Here named bindSetComponentToData()
    _wrappedComponent.of = bindSetComponentToData.bind(
      _wrappedComponent,
      shapeClass,
    );

    //keep a copy of the original for strict checking of equality when compared to
    _wrappedComponent.original = functionalComponent;

    _wrappedComponent.query = dataRequest;

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
  }

  function linkedComponentClass<ShapeType extends Shape, P = {}>(
    shapeClass: typeof Shape,
  ): ClassDecorator {
    //this is for Components declared with ES Classes
    //in this case the function we're in will be used as a decorator: @linkedComponent(SomeShapeClass)
    //class decorators return a function that receives a constructor and returns a constructor.
    let decoratorFunction = function <T>(constructor) {
      //add the component class of this module to the global tree
      registerPackageExport(constructor);

      //link the shape
      constructor['shape'] = shapeClass;

      //register the component and its shape
      registerComponent(constructor as any, shapeClass);

      //return the original class without modifications
      // return constructor;

      //only here we have shapeClass as a value (not in LinkedComponentClass)
      //so here we can return a new class that extends the original class,
      //but it adds linked properties like sourceShape
      let wrappedClass = class extends constructor {
        constructor(props) {
          let linkedProps = getLinkedComponentProps<ShapeType, P>(
            props,
            shapeClass,
          );
          super(linkedProps);
        }
      } as any as T;
      //copy the name
      Object.defineProperty(wrappedClass, 'name', {value: constructor.name});
      Object.defineProperty(wrappedClass, 'original', {value: constructor});
      return wrappedClass;
    };
    return decoratorFunction;
  }

  //create a declarator function which Shapes of this module can use register themselves and add themselves to the global tree
  let linkedShape = function (constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //register the component and its shape
    Shape.registerByType(constructor);

    //if no shape object has been attached to the constructor
    if (!Object.getOwnPropertyNames(constructor).includes('shape')) {
      let packageNameURI = URI.sanitize(packageName);

      //create a new node shape for this shapeClass
      let shape: NodeShape = NodeShape.getFromURI(
        `${LINCD_DATA_ROOT}module/${packageNameURI}/shape/${URI.sanitize(
          constructor.name,
        )}`,
      );
      //connect the typescript class to its NodeShape
      constructor.shape = shape;
      //set the name
      shape.label = constructor.name;
      //also keep track of the reverse: nodeShape to typescript class (helpful for sending shapes between environments with JSONWriter / JSONParser)
      addNodeShapeToShapeClass(shape, constructor);

      //also create a representation in the graph of the shape class itself
      let shapeClass = NamedNode.getOrCreate(
        `${LINCD_DATA_ROOT}module/${packageNameURI}/shapeclass/${URI.sanitize(
          constructor.name,
        )}`,
        true,
      );
      shapeClass.set(lincdOntology.definesShape, shape.node);
      shapeClass.set(rdf.type, lincdOntology.ShapeClass);

      //and connect it back to the module
      shapeClass.set(lincdOntology.module, packageNode);

      //if linkedProperties have already registered themselves
      if (constructor.propertyShapes) {
        //then add them to this node shape now
        constructor.propertyShapes.forEach((propertyShape) => {
          let uri =
            shape.namedNode.uri + `/${URI.sanitize(propertyShape.label)}`;

          //with react hot reload, sometimes the same code gets loaded twice
          //and a node with this URI will already exist,
          //in that case we can ignore it, since the nodeShape will already have the propertyShape
          if (!NamedNode.getNamedNode(uri)) {
            //update the URI (by extending the URI of the shape)
            propertyShape.namedNode.uri =
              shape.namedNode.uri + `/${URI.sanitize(propertyShape.label)}`;

            shape.addPropertyShape(propertyShape);
          }
        });
        //and remove the temporary key
        delete constructor.propertyShapes;
      }

      //if property shapes referred to this node shape as the required shape for their values
      // (note that accessor decorators always evaluate before class decorators, hence we sometimes need to process this here, AFTER the property decorators have run)
      if (constructor.nodeShapeOf) {
        constructor.nodeShapeOf.forEach((propertyShape: PropertyShape) => {
          //now that we have a NodeShape for this shape class, we can set the nodeShape of the property shape
          propertyShape.valueShape = shape;
        });
      }
    } else {
      // (constructor.shape.node as NamedNode).uri = URI;
      console.warn('This ShapeClass already has a shape: ', constructor.shape);
    }

    if (constructor.targetClass) {
      (constructor.shape as NodeShape).targetClass = constructor.targetClass;
    }

    //return the original class without modifications
    return constructor;
  };

  /**
   *
   * @param exports all exports of the file, simply provide "this" as value!
   * @param dataSource the path leading to the ontology's data file
   * @param nameSpace the base URI of the ontology
   * @param prefixAndFileName the file name MUST match the prefix for this ontology
   */
  let linkedOntology = function (
    exports,
    nameSpace: (term: string) => NamedNode,
    prefixAndFileName: string,
    loadData?,
    dataSource?: string | string[],
  ) {
    //store specifics in exports. And make sure we can detect this as an ontology later
    exports['_ns'] = nameSpace;
    exports['_prefix'] = prefixAndFileName;
    exports['_load'] = loadData;
    exports['_data'] = dataSource;

    //register the prefix here (so just calling linkedOntology with a prefix will automatically register that prefix)
    if (prefixAndFileName) {
      //run the namespace without any term name, this will give back a named node with just the namespace as URI, then get that URI to provide it as full URI
      Prefix.add(prefixAndFileName, nameSpace('').uri);
    }

    ontologies.add(exports);
    //register all the exports under the prefix. NOTE: this means the file name HAS to match the prefix
    registerInPackageTree(prefixAndFileName, exports);
    // });

    if (autoLoadOntologyData) {
      loadData().catch((err) => {
        console.warn(
          'Could not load ontology data. Do you need to rebuild the module of the ' +
            prefixAndFileName +
            ' ontology?',
          err,
        );
      });
    }
  };

  //return the declarators so the module can use them
  return {
    linkedComponent,
    linkedComponentClass,
    linkedSetComponent,
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerPackageExport,
    registerPackageModule,
    packageExports: packageTreeObject,
    packageName: packageName,
  } as LinkedPackageObject;
}

type ProcessDataResultType<ShapeType extends Shape> = [
  typeof Shape,
  SelectQuery<ShapeType>,
  LinkedQuery<ShapeType>,
];

function processDataDeclaration<ShapeType extends Shape>(
  requiredData: LinkedQuery<ShapeType> | QueryWrapperObject<ShapeType>,
  setComponent: boolean = false,
): ProcessDataResultType<ShapeType> {
  let shapeClass: typeof Shape;
  let dataRequest: SelectQuery<ShapeType>;
  let query: LinkedQuery<ShapeType>;

  //if a Shape class was given (the actual class that extends Shape)
  if (requiredData instanceof LinkedQuery) {
    dataRequest = requiredData.getQueryObject();
    query = requiredData;
    shapeClass = requiredData.shape as any;
  } else if (typeof requiredData === 'object' && setComponent) {
    if (Object.keys(requiredData).length > 1) {
      throw new Error(
        'Only one key is allowed to map a query to a property for linkedSetComponents',
      );
    }
    for (let key in requiredData) {
      if (requiredData[key] instanceof LinkedQuery) {
        dataRequest = requiredData[key].getQueryObject();
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
  return [shapeClass, dataRequest, query];
}

function resolveLinkedQuery<Resp>(
  linkedQuery: LinkedQuery<any, Resp>,
  // source: Shape | ShapeSet,
  // dataRequest: ComponentQueryPath[],
  // pureDataRequest: QueryPath[],
): Promise<QueryResponseToResultType<Resp>> {
  // return resolveLocalEndResults(linkedQuery, source, dataRequest);
  return LinkedStorage.query(linkedQuery);
  // return linkedData;
}

function getLinkedDataResponse<ShapeType extends Shape>(
  dataRequestFn: LinkedDataRequestFn<ShapeSet<ShapeType>>,
  source: ShapeSet<ShapeType>,
  tracedDataResponse: TransformedLinkedDataResponse,
): LinkedDataResponse;
function getLinkedDataResponse<ShapeType extends Shape>(
  dataRequestFn: LinkedDataRequestFn<ShapeType>,
  source: ShapeType,
  tracedDataResponse: TransformedLinkedDataResponse,
): LinkedDataResponse;
function getLinkedDataResponse<ShapeType extends Shape>(
  dataRequestFn: LinkedDataRequestFn<any>,
  source: ShapeType | ShapeSet<ShapeType>,
  tracedDataResponse: TransformedLinkedDataResponse,
): LinkedDataResponse {
  let dataResponse: LinkedDataResponse = dataRequestFn(source);

  let replaceBoundComponent = (value, key?) => {
    //if a function was returned for this key
    if (typeof value === 'function') {
      //then call the function to get the actual intended value
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && evaluated._create) {
        //here we get the propertyShapes that were required to obtain the source
        // when we evaluated the function when the component was first initialised
        let props = key
          ? tracedDataResponse[key]._props
          : (tracedDataResponse as BoundComponentFactory)._props;
        evaluated = (evaluated as BoundComponentFactory<any, any>)._create(
          props,
        );
      }
      return evaluated;
    }
    return value;
  };
  if (Array.isArray(dataResponse)) {
    (dataResponse as any[]).forEach((value, index) => {
      dataResponse[index] = replaceBoundComponent(value, index);
    });
  } else if (typeof dataResponse === 'function') {
    dataResponse = replaceBoundComponent(dataResponse);
  } else {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      dataResponse[key] = replaceBoundComponent(dataResponse[key], key);
    });
  }
  return dataResponse;
}

function replaceSubRequestsFromTraceShapes(traceShape: Shape) {
  //for each propertyShape that was requested
  (traceShape as TraceShape).requested.forEach(
    (propertyShapeRequest, index) => {
      //get returned value for this requested property shape
      let value = (traceShape as TraceShape).responses[index];
      //if the value is a traceShape
      if (value instanceof Shape) {
        //then iteratively replace that shapes sub requests
        replaceSubRequestsFromTraceShapes(value as TraceShape);

        //and replace the previous value with a new subrequest
        (traceShape as TraceShape).requested[index] = [
          propertyShapeRequest as PropertyShape,
          (value as TraceShape).requested,
        ];
      }
    },
  );
}

//This method can be used in two ways, the first parameter must match with the type of the second,
//hence the multiple function declarations (overloads)
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn: LinkedDataRequestFn<ShapeType>,
  instance: ShapeType & TraceShape,
): [LinkedDataRequest, TransformedLinkedDataResponse];
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn:
    | LinkedFunctionalComponent<ShapeType>
    | LinkedDataRequestFn<ShapeSet<ShapeType>>,
  instance: ShapeSet<ShapeType & TraceShape>,
): [LinkedDataRequest, TransformedLinkedDataResponse];
function createDataRequestObject<ShapeType extends Shape>(
  dataRequestFn:
    | LinkedFunctionalComponent<ShapeType>
    | LinkedDataRequestFn<ShapeType>
    | LinkedDataRequestFn<ShapeSet<ShapeType>>,
  instance: any,
): [LinkedDataRequest, TransformedLinkedDataResponse] {
  if ((dataRequestFn as LinkedFunctionalComponent<ShapeType>).of) {
    return [null, null];
  }
  //run the function that the component provided to see which properties it needs
  let dataResponse = dataRequestFn(instance);

  //for sets, we should get a set with a single item, so we can retrieve traced properties from that single item
  let traceInstance =
    instance instanceof ShapeSet ? instance.first() : instance;

  //first finish up the dataRequest object by inserted nested requests from shapes
  replaceSubRequestsFromTraceShapes(traceInstance);

  //start with the requested properties, which is an array of PropertyShapes
  let dataRequest: LinkedDataRequest = traceInstance.requested;

  let insertSubRequestsFromBoundComponent = (value, target?, key?) => {
    //if a shape was returned for this key
    // if (value instanceof Shape) {
    //   //then add all the things that were requested from this shape as a nested sub request
    //   insertSubRequestForTraceShape(dataRequest,key,value as TraceShape);
    // }
    //if a function was returned for this key
    if (typeof value === 'function') {
      //count the current amount of property shapes requested so far
      let previousNumPropShapes = traceInstance.requested.length;

      //then call the function to get the actual intended value
      //this will also trigger new accessors to be called & property shapes to be added to 'traceInstance.requested'
      let evaluated = (value as Function)();
      //if a bound component was returned
      if (evaluated && (evaluated as BoundComponentFactory)._create) {
        //retrieve and remove any propertyShape that were requested
        let appliedPropertyShapes = traceInstance.requested.splice(
          previousNumPropShapes,
        );
        //store them in the bound component factory object,
        //we will need that when we actually use the nested component
        evaluated._props = appliedPropertyShapes;

        //then place back an object stating which property shapes were requested
        //and which subRequest need to be made for those as defined by the bound child component
        debugger;
        // let subRequest: LinkedDataRequest = (evaluated as BoundComponentFactory)
        //   ._comp.query;
        let subRequest;
        if ((evaluated as BoundSetComponentFactory)._childDataRequest) {
          subRequest = subRequest.concat(
            (evaluated as BoundSetComponentFactory<any, any>)._childDataRequest,
          ) as LinkedDataRequest;
        }
        if (appliedPropertyShapes.length > 1) {
          console.warn(
            'Using multiple property shapes for subRequests are not yet supported',
          );
        }
        let propertyShape = appliedPropertyShapes[0];

        //add an entry for the bound property with its subRequest (the data request of the component it was bound to)
        //if a specific property shape was requested for this component (like CompA(Shape.request(shape => CompB.of(shape.subProperty))
        if (propertyShape) {
          //then add it as a propertyShape + subRequest
          dataRequest.push([propertyShape, subRequest]);
        } else {
          //but if not, then the component uses the SAME source (like CompA(Shape.request(s => CompB.of(s)))
          //in this case the dataRequest of CompB can be directly added to that of CompA
          //because its requesting properties of the same subject
          //this keeps the request plain and simple for the stores that need to resolve it
          dataRequest = dataRequest.concat(subRequest);
        }
      }
      return evaluated;
    }
    return value;
  };

  //whether the component returned an array, a function or an object, replace the values that are bound-component-factories
  if (Array.isArray(dataResponse)) {
    (dataResponse as any[]).forEach((value, index) => {
      dataResponse[index] = insertSubRequestsFromBoundComponent(value);
    });
  } else if (typeof dataResponse === 'function') {
    dataResponse = insertSubRequestsFromBoundComponent(dataResponse);
  } else {
    Object.getOwnPropertyNames(dataResponse).forEach((key) => {
      dataResponse[key] = insertSubRequestsFromBoundComponent(
        dataResponse[key],
      );
    });
  }
  return [dataRequest, dataResponse as any as TransformedLinkedDataResponse];
}

function registerComponent(exportedComponent: Component, shape?: typeof Shape) {
  if (!shape) {
    //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
    if (!exportedComponent.hasOwnProperty('shape')) {
      console.warn(
        `Component ${
          exportedComponent.displayName || exportedComponent.name
        } is not linked to a shape.`,
      );
      return;
    }
    shape = exportedComponent.shape;
  }

  if (!shapeToComponents.has(shape)) {
    shapeToComponents.set(shape, new CoreSet<any>());
  }

  shapeToComponents.get(shape).add(exportedComponent);
}

function registerPackageInTree(packageName, packageExports?) {
  //prepare name for global tree reference
  // let packageTreeKey = packageName.replace(/-/g,'_');
  //if something with this name already registered in the global tree
  if (packageName in lincd._modules) {
    //This probably means package.ts is loaded twice, through different paths and could point to a problem
    //So we log about it. But there is one exception. LINCD itself registers itself twice: once in the bottom of this file and once in its package.ts file.
    //But if there are already other packages registered, then probably there is 2 versions of LINCD being loaded, and that IS a problem.
    if (packageName !== 'lincd' || Object.keys(lincd._modules).length !== 1) {
      console.warn(
        'A package with the name ' +
          packageName +
          ' has already been registered. Adding to existing object',
      );
    }
    Object.assign(lincd._modules[packageName], packageExports);
  } else {
    //initiate an empty object for this module in the global tree
    lincd._modules[packageName] = packageExports || {};
  }
  return lincd._modules[packageName];
}

function getSourceFromInputProps(props, shapeClass) {
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

function getLinkedComponentProps<ShapeType extends Shape, P>(
  props: LinkedComponentInputProps<ShapeType> & P,
  shapeClass,
): LinkedComponentProps<ShapeType> & P {
  let newProps = {
    ...props,
    //if a node was given, convert it to a shape instance
    source: getSourceFromInputProps(props, shapeClass),
  };

  delete newProps['of'];
  delete newProps['isBound'];
  return newProps;
}

function getLinkedSetComponentProps<ShapeType extends Shape, P>(
  props: LinkedSetComponentInputProps<ShapeType> & P,
  shapeClass,
  functionalComponent,
): LinkedSetComponentProps<ShapeType> & P {
  if (
    props.of &&
    !(props.of instanceof NodeSet) &&
    !(props.of instanceof ShapeSet) &&
    !Array.isArray(props.of) &&
    (props.of as QResult<any>[]).every(
      (qResult) => qResult.shape instanceof Shape,
    ) &&
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
        return qResult.shape;
      }),
    );
  }
  const newProps = {
    ...props,
    //if a NodeSet was given, convert it to a ShapeSet
    sources,
  };

  delete newProps['of'];
  return newProps;
}

export function initTree() {
  let globalObject =
    typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : undefined;
  if ('lincd' in globalObject) {
    throw new Error('Multiple versions of LINCD are loaded');
  } else {
    globalObject['lincd'] = {_modules: {}};
  }
}

function bindComponentToData<
  Source extends QueryBuilderObject,
  P,
  ShapeType extends Shape,
>(source: Source): BoundComponent<Source, ShapeType> {
  return new BoundComponent<Source, ShapeType>(this, source);
}

function bindSetComponentToData<P, ShapeType extends Shape>(
  shapeClass: typeof Shape,
  sources: NodeSet | ShapeSet<ShapeType>,
  childDataRequestFn?: LinkedDataChildRequestFn<ShapeType>,
): BoundSetComponentFactory<P, ShapeType> {
  let tracedChildDataResponse: TransformedLinkedDataResponse;
  let childDataRequest: LinkedDataRequest;
  //if a childDataRequestFn was given (as second argument of SetComponent.of())
  if (childDataRequestFn) {
    //if a single bound component was given
    if ((childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of) {
      //we can access its required properties directly
      debugger;
      // childDataRequest = (
      //   childDataRequestFn as LinkedFunctionalComponent<ShapeType>
      // ).query;
    } else {
      //else, a child data request function was given as second argument of .of()
      //then create a test instance of the shape
      let dummyInstance = createTraceShape(
        shapeClass,
        null,
        this.name ||
          this.toString().substring(0, 60).replace(/\n/g, ' ') + ' ...',
      );

      //and run the function that the component provided to see which properties it needs
      [childDataRequest, tracedChildDataResponse] = createDataRequestObject(
        childDataRequestFn as LinkedDataRequestFn<ShapeType>,
        dummyInstance,
      );
    }
  }

  return {
    _comp: this,
    //we store the childDataRequest (an array of property shapes) so that it can be accessed when stringing together a full data request
    _childDataRequest: childDataRequest,
    _create: (propertyShapes) => {
      let boundComponent: LinkedFunctionalSetComponent<P, ShapeType> = (
        props,
      ) => {
        //TODO: use propertyShapes for RDFa

        //manually transfer the value of the first parameter of Component.of() to an of prop in JSX
        let newProps: LinkedSetComponentProps<any> = {...props} as any;
        //Note: we use bracket notation here because technically this method is working with InputProps and adding to those input props
        //But we are setting props to be used in the final LinkedSetComponentProps, so we're using that definition to define other properties below
        //But here we need to define 'of' which is an input prop
        newProps['of'] = sources;
        //and isBound which is a temporary internal prop that is currently not defined in any interface
        newProps['isBound'] = true;

        //if SetComponent.of received a child data request as second argument
        // i.e. Grid.of(persons,PersonProfileCard) which means shows a grid of persons as profile cards
        if (childDataRequestFn) {
          let childRenderFn;
          //if a single component was given, instead of a request
          if ((childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of) {
            //then use that component as to render the child items
            childRenderFn = childDataRequestFn;
          } else {
            //else, a child data request function was given as second argument
            //for this, props.children must be single item that is a function that we can use to render the children
            if (typeof props.children === 'function') {
              childRenderFn = props.children as Function;
            } else if (React.Children.count(props.children) == 0) {
              throw new Error(
                'Invalid use of Grid. Provide fixed child components or a render function as a single child. Alternatively, return a single bound component in the child data request.',
              );
            }
          }

          //then we provide a ChildComponent prop, which is a render function that uses the childRenderFn defined above
          // newProps.ChildComponent = (childProps) => {
          //   let newChildProps = {...childProps};
          //
          //   //children are 'bound', meaning their data will always be loaded
          //   newChildProps['isBound'] = true;
          //
          //   //automatically set a key for each child component if a source is set
          //   if (newChildProps.of) {
          //     newChildProps['key'] =
          //       newChildProps.of instanceof Shape
          //         ? newChildProps.of.node.toString()
          //         : newChildProps.of.toString();
          //   }
          //
          //   //if a dataRequest was given (not a component)
          //   if (
          //     !(childDataRequestFn as LinkedFunctionalComponent<ShapeType>).of
          //   ) {
          //     //NOTE: unlike other places where we call getLinkedDataResponse, the child component is a linkedComponent, which will convert the input props ('of') to source. so, we don't want to already do that here.
          //     // Hence, we manually get the source from props to get the linkedDataResponse
          //     let source = getSourceFromInputProps(childProps, shapeClass);
          //
          //     //then we resolve that and use it as linkedData for the child component
          //     newChildProps.linkedData = getLinkedDataResponse(
          //       childDataRequestFn as LinkedDataRequestFn<ShapeType>,
          //       source,
          //       tracedChildDataResponse as TransformedLinkedDataResponse,
          //     );
          //   }
          //
          //   return childRenderFn(newChildProps);
          // };
        }

        //render the child component (which is 'this')
        return React.createElement(this, newProps);
      };
      //set an identifiable name for this bound component
      Object.defineProperty(boundComponent, 'name', {
        value: 'bound_' + this.name,
      });
      return boundComponent;
    },
  };
}

//when this file is used, make sure the tree is initialized
initTree();

let lincdPackage = linkedPackage('lincd');
lincdPackage.linkedShape(NodeShape);
lincdPackage.linkedShape(PropertyShape);
