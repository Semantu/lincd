/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {NamedNode} from '../models.js';
import {NodeShape, PropertyShape} from '../shapes/SHACL.js';
import {Shape} from '../shapes/Shape.js';
import {Prefix} from './Prefix.js';
import {CoreSet} from '../collections/CoreSet.js';
import {lincd as lincdOntology} from '../ontologies/lincd.js';
import {npm} from '../ontologies/npm.js';
import {rdf} from '../ontologies/rdf.js';
import {URI} from './URI.js';
import {addNodeShapeToShapeClass} from './ShapeClass.js';
import {
  createLinkedComponentFn,
  createLinkedSetComponentFn,
  Component,
  LinkedComponentFactoryFn,
  LinkedSetComponentFactoryFn,
} from '../utils/LinkedComponent';

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
// type ClassDecorator = <T extends {new (...args: any[]): {}}>(
//   constructor: T,
// ) => T;

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
  // linkedComponentClass: <ShapeType extends Shape, P = {}>(
  //   shapeClass: typeof Shape,
  // ) => ClassDecorator;
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
   * import {linkedOntology} from '../package.js';
   * import * as _this from './my.js-ontology';
   *
   * let dataFile = '../data/my.js-ontology.json';
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
  linkedComponent: LinkedComponentFactoryFn;

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
  linkedSetComponent: LinkedSetComponentFactoryFn;

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
  const linkedComponent = createLinkedComponentFn(
    registerPackageExport,
    registerComponent,
  );

  const linkedSetComponent = createLinkedSetComponentFn(
    registerPackageExport,
    registerComponent,
  );

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

//when this file is used, make sure the tree is initialized
initTree();

let lincdPackage = linkedPackage('lincd');
lincdPackage.linkedShape(NodeShape);
lincdPackage.linkedShape(PropertyShape);
