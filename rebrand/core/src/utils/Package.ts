/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {
  createPropertyShape,
  getAndClearCallbacks,
  getNodeShapeUri,
  LINCD_DATA_ROOT,
  NodeShape,
  PropertyShape,
} from '../shapes/SHACL.js';
import {Shape} from '../shapes/Shape.js';
import {Prefix} from './Prefix.js';
import {lincd as lincdOntology} from '../ontologies/lincd.js';
import {rdf} from '../ontologies/rdf.js';
import {addNodeShapeToShapeClass,getShapeClass} from './ShapeClass.js';
import {shacl} from '../ontologies/shacl.js';
import {rdfs} from '../ontologies/rdfs.js';
import {xsd} from '../ontologies/xsd.js';
import {NodeReferenceValue} from './NodeReference.js';

//global tree
declare var lincd: any;
declare var window;
declare var global;


// var packageParsePromises: Map<string,Promise<any>> = new Map();
// var loadedPackages: Set<NamedNode> = new Set();
let ontologies: Set<any> = new Set();
let _autoLoadOntologyData = false;
/**
 * a map of requested property shapes for specific nodes
 * The value is a promise if it's still loading, or true if it is fully loaded
 */
// type ClassDecorator = <T extends {new (...args: any[]): {}}>(
//   constructor: T,
// ) => T;

export type ShapeConfig = {
  /**
   * A short description of the shape, what it represents and what it is used for.
   * will be stored as rdfs:comment on the shape node
   */
  description?: string;
};

export type PackageMetadata = {
  id: string;
  packageName: string;
  type: NodeReferenceValue;
};

/**
 * This object, returned by [linkedPackage()](/docs/lincd.js/modules/utils_Module#linkedPackage),
 * contains the decorators to link different parts of a LINCD module.
 */
export interface LinkedPackageObject
{
  /**
   * Links a typescript class to a SHACL shape.
   * This decorator creates a SHACL shape and looks at the static property [targetClass](/docs/lincd.js/classes/shapes_Shape.Shape#targetclass)
   * The rest of the shape is typically 'shaped' by methods that use [property decorators](/docs/lincd.js/modules/utils_ShapeDecorators).
   *
   * @example
   * Example of a typescript class using the \@linkedShape decorator:
   * ```tsx
   * @linkedShape
   * export class Person extends Shape { ... }
   * ```
   * Or with options:
   * ```tsx
   * @linkedShape({ description: "..." })
   * export class Person extends Shape { ... }
   * ```
   */
  linkedShape: {
    <T extends typeof Shape>(constructor: T): void;
    <T extends typeof Shape>(config?: ShapeConfig): (constructor: T) => void;
  };
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
   * @param loadDataFunction - a method that loads _and parses_ the raw ontology data. This means the ontology will be loaded into the local graph. The returned result is mostly a JSONLDParsePromise (from lincd-jsonld/JSONLD, not bundled in LINCD.js)
   * @param dataSource - the relative path to the raw data of the ontology
   * @example
   * Example of an Ontology File that used linkedOntology()
   * ```tsx
   * import {NamedNode} from 'lincd/models';
   * import {JSONLD} from 'lincd-jsonld/JSONLD';
   * import {createNameSpace} from 'lincd/utils/NameSpace';
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
    nameSpace: (term: string) => NodeReferenceValue,
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
   * A method to get a shape class in this package by its name.
   * This is helpful to avoid circular dependencies between shapes.
   * For example see Thing.ts which uses get image():ImageObject.
   * ImageObject extends Things.
   * So get image() is implemented with getOneAs(...,getPackageShape('ImageObject'))
   * @param name
   */
  getPackageShape: (name: string) => typeof Shape;
  /**
   * A reference to the modules' object in the LINCD tree.
   * Contains all linked components of the module.
   */
  packageExports: any;
  packageName: string;
  packageMetadata: PackageMetadata;

  /**
   * Register a file (a javascript module) and all its exported objects.
   * Specifically helpful for registering multiple functional components if you declare them without a function name
   * @param _this
   * @param _module
   */
  registerPackageModule(_module): void;
}

export var DEFAULT_LIMIT = 12;

export function setDefaultPageLimit(limit: number)
{
  DEFAULT_LIMIT = limit;
}

export function autoLoadOntologyData(value: boolean)
{
  _autoLoadOntologyData = value;
  //this may be set to true after some ontologies have already indexed,
  if (_autoLoadOntologyData)
  {
    // so in that case we load all data of ontologies that are already indexed
    ontologies.forEach((ontologyExport) => {
      //see linkedOntology() where we store the data loading method under the _load key
      if (ontologyExport['_load'])
      {
        ontologyExport['_load']();
      }
    });
  }
}


export function linkedPackage(packageName: string): LinkedPackageObject
{
  let packageMetadata = registerPackageMetadata(packageName);
  let packageTreeObject = registerPackageInTree(packageName);

  //#Create declarators for this module
  let registerPackageExport = function(object) {
    if (object.name in packageTreeObject)
    {
      console.warn(
        `Key ${object.name} was already defined for package ${packageName}. Note that LINCD currently only supports unique names across your entire package. Overwriting ${object.name} with new value`,
      );
    }
    packageTreeObject[object.name] = object;
  };

  let registerInPackageTree = function(exportName,exportedObject) {
    packageTreeObject[exportName] = exportedObject;
  };

  function registerPackageModule(_module): void
  {
    for (var key in _module.exports)
    {
      //if the exported object itself is not named or its name is _wrappedComponent
      //then we give it the same name as it's export name.
      if (
        !_module.exports[key].name ||
        _module.exports[key].name === '_wrappedComponent'
      )
      {
        Object.defineProperty(_module.exports[key],'name',{value: key});
        //manual 'hack' to set the name of the original function
        if (
          _module.exports[key]['original'] &&
          !_module.exports[key]['original']['name']
        )
        {
          Object.defineProperty(_module.exports[key]['original'],'name',{
            value: key + '_implementation',
          });
        }
      }
      registerInPackageTree(key,_module.exports[key]);
    }
  }

  //create a declarator function which Components of this module can use register themselves and add themselves to the global tree
  let linkedUtil = function(constructor) {
    //add the component class of this module to the global tree
    registerPackageExport(constructor);

    //return the original class without modifications
    return constructor;
  };

  // helper that contains the previous body; applies the decorator work to a given constructor
  function applyLinkedShape<T extends typeof Shape>(
    constructor: T,
    options?: ShapeConfig,
  ): void
  {
    if(!constructor) {
      throw new Error('Constructor is undefined, skipping registration: '+constructor?.toString().substring(0,100)+' '+JSON.stringify(options));
      return;
    }
    // add the component class of this module to the global tree
    registerPackageExport(constructor);

    // register the component and its shape
    Shape.registerByType(constructor);

    // if no shape object has been attached to the constructor
    if (!Object.getOwnPropertyNames(constructor).includes('shape'))
    {
      // create a new node shape for this shapeClass
      let nodeShape: NodeShape = new NodeShape(
        getNodeShapeUri(packageName, constructor.name),
      );
      // connect the typescript class to its NodeShape
      constructor.shape = nodeShape;
      // set the name
      nodeShape.label = constructor.name;

      if (options)
      {
        if (options.description)
        {
          nodeShape.description = options.description;
        }
      }

      // also keep track of the reverse: nodeShape to typescript class
      addNodeShapeToShapeClass(nodeShape,constructor);

      //track what extends what (nodeShape level)
      const extendingShapeClass = Object.getPrototypeOf(
        constructor,
      ) as typeof Shape;
      const extendingShape = extendingShapeClass.shape;
      //if this shape class is extending something other then Shape
      if (extendingShape && !(extendingShapeClass === Shape)) {
        //store which nodeShape this nodeShape extends
        nodeShape.extends = {id: extendingShape.id};
      }
      

      // run deferred callbacks from property decorators
      if (constructor['shapeCallbacks'])
      {
        constructor['shapeCallbacks'].forEach((callback) => {
          callback(nodeShape);
        });
        const nodeCallbacks = getAndClearCallbacks(nodeShape.id);
        if(nodeCallbacks) {
          nodeCallbacks.forEach((callback) => {
            callback(nodeShape);
          });
        }
        delete constructor['shapeCallbacks'];
      }
    }
    else
    {
      console.warn('This ShapeClass already has a shape: ',constructor.shape);
    }

    if (constructor.targetClass)
    {
      (constructor.shape as NodeShape).targetClass = constructor.targetClass;
    }

    // return the original class without modifications
    // return constructor;
  }

  // Overloaded signatures to support both usages
  function linkedShape<T extends typeof Shape>(constructor: T): void;
  function linkedShape<T extends typeof Shape>(
    options?: ShapeConfig,
  ): (constructor: T) => void;
  function linkedShape(arg?: any): void | ((constructor: any) => void)
  {
    // usage as @linkedShape
    if (typeof arg === 'function')
    {
      applyLinkedShape(arg);
      return;
    }
    // usage as @linkedShape({...}) or @linkedShape()
    const options: ShapeConfig | undefined = arg;
    return function <T extends typeof Shape>(constructor: T): void {
      applyLinkedShape(constructor,options);
    };
  }

  /**
   *
   * @param exports all exports of the file, simply provide "this" as value!
   * @param dataSource the path leading to the ontology's data file
   * @param nameSpace the base URI of the ontology
   * @param prefixAndFileName the file name MUST match the prefix for this ontology
   */
  let linkedOntology = function(
    exports,
    nameSpace: (term: string) => NodeReferenceValue,
    prefixAndFileName: string,
    loadData?,
    dataSource?: string | string[],
  ) {
    let exportsCopy = {...exports};
    //store specifics in exports. And make sure we can detect this as an ontology later
    exportsCopy['_ns'] = nameSpace;
    exportsCopy['_prefix'] = prefixAndFileName;
    exportsCopy['_load'] = loadData;
    exportsCopy['_data'] = dataSource;

    //register the prefix here (so just calling linkedOntology with a prefix will automatically register that prefix)
    if (prefixAndFileName)
    {
      //run the namespace without any term name, this will give back a named node with just the namespace as URI, then get that URI to provide it as full URI
      Prefix.add(prefixAndFileName,nameSpace('').id);
    }

    ontologies.add(exportsCopy);
    //register all the exports under the prefix. NOTE: this means the file name HAS to match the prefix
    registerInPackageTree(prefixAndFileName,exportsCopy);
    // });

    if (_autoLoadOntologyData)
    {
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

  /**
   * This method is used to get a shape class in this package by its name.
   * This can be used to avoid circular dependencies between shapes.
   * @param name
   */
  let getPackageShape = (name: string): typeof Shape => {
    //get the named node of the node shape first,
    //then get the shape class that defines this node shape
    return getShapeClass(
      getNodeShapeUri(packageName, name),
    );
  };

  //return the declarators so the module can use them
  return {
    linkedShape,
    linkedUtil,
    linkedOntology,
    registerPackageExport,
    registerPackageModule,
    getPackageShape,
    packageExports: packageTreeObject,
    packageName: packageName,
    packageMetadata,
  } as LinkedPackageObject;
}

function registerPackageInTree(packageName,packageExports?)
{
  //prepare name for global tree reference
  // let packageTreeKey = packageName.replace(/-/g,'_');
  //if something with this name already registered in the global tree
  if (packageName in lincd._modules)
  {
    //This probably means package.ts is loaded twice, through different paths and could point to a problem
    //So we log about it. But there is one exception. LINCD itself registers itself twice: once in the bottom of this file and once in its package.ts file.
    //But if there are already other packages registered, then probably there is 2 versions of LINCD being loaded, and that IS a problem.
    if (packageName !== '@_linked/core' || Object.keys(lincd._modules).length !== 1)
    {
      console.warn(
        'A package with the name ' +
        packageName +
        ' has already been registered. Adding to existing object',
      );
    }
    Object.assign(lincd._modules[packageName],packageExports);
  }
  else
  {
    //initiate an empty object for this module in the global tree
    lincd._modules[packageName] = packageExports || {};
  }
  return lincd._modules[packageName];
}

function registerPackageMetadata(packageName: string): PackageMetadata
{
  if (!lincd._packages)
  {
    lincd._packages = {};
  }
  if (packageName in lincd._packages)
  {
    return lincd._packages[packageName];
  }
  const packageMetadata: PackageMetadata = {
    id: `${LINCD_DATA_ROOT}module/${packageName}`,
    packageName,
    type: lincdOntology.Module,
  };
  lincd._packages[packageName] = packageMetadata;
  return packageMetadata;
}


export function initTree()
{
  let globalObject =
    typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : undefined;
  if ('lincd' in globalObject)
  {
    throw new Error('Multiple versions of LINCD are loaded');
  }
  else
  {
    globalObject['lincd'] = {_modules: {}, _packages: {}};
  }
}

//when this file is used, make sure the tree is initialized
initTree();

//now that this file is set up, we can link linked shapes in the core module itself
export const corePackage = linkedPackage('@_linked/core');
corePackage.linkedShape({
  description:
    'Represents a SHACL NodeShape; defines constraints for a class of RDF nodes. Links to multiple PropertyShapes. (schema, constraint, class validation)',
})(NodeShape);
corePackage.linkedShape({
  description:
    'Represents a SHACL PropertyShape; specifies rules for one property of a NodeShape (path, datatype, cardinality). (validation rule, property constraint)',
})(PropertyShape);
// ValidationReport / ValidationResult removed in core metadata rewrite

//ALL the following is to support Shape having get/set methods with property shapes
//and Shape itself having a nodeShape
//if we dont need Shape to have get/set methods (like label and type) then this can be removed
Shape.shape = new NodeShape(
  'https://data.lincd.org/module/lincd/shape/shape',
);
addNodeShapeToShapeClass(Shape.shape,Shape);

//Here we can register the properties of the Shape class itself
//We can't do that inside of Shape because it would cause circular dependencies
createPropertyShape({
    path: rdfs.label,
    //TODO: multiple labels should be possible
    maxCount: 1,//currently get label is implemented to return a single value
  },
  'label',
  shacl.Literal,
  Shape,
);
createPropertyShape(
  {
    path: rdf.type,
    shape: Shape,
  },
  'type',
  shacl.IRI,
  Shape,
);

createPropertyShape(
  {
    path: shacl.property,
    shape: PropertyShape,
  },
  'properties',
  shacl.IRI,
  NodeShape,
);

createPropertyShape({
      path: rdfs.comment,
      maxCount: 1,
    },'description',shacl.Literal, NodeShape);

createPropertyShape({
  path: rdf.type,
  maxCount: 1,
  shape: Shape,
},'type',shacl.IRI, NodeShape);

createPropertyShape(
  {
    path: shacl.targetClass,
    shape: Shape, //should be rdfs Class, but that's currently not available in LINCD. So queries currently cannot continue after accessing targetClass
    maxCount: 1,
  },
  'targetClass',
  shacl.IRI,
  NodeShape,
);

createPropertyShape({
  path: shacl.description,
  maxCount: 1,
},'type',shacl.Literal, NodeShape);

createPropertyShape({
  path: shacl.targetNode,
  shape: Shape,//actually returns a NamedNode... is this correct then? Should we define or use a rdfs Class that matches the potential values?
},'targetNode',shacl.IRI, NodeShape);

createPropertyShape({
  path: lincdOntology.isExtending,
  shape: NodeShape,
},'extends',shacl.IRI, NodeShape);

//currently path accepts multiple values, so its a multi-value property
//these values will be consequent properties that follow each other. Other property paths are not supported yet.
createPropertyShape(
  {
    path: shacl.path,
    shape: Shape,
  },
  'path',
  shacl.IRI,
  PropertyShape,
);

createPropertyShape(
  {
    path: shacl.node,
    shape: NodeShape,
    maxCount: 1,
  },
  'valueShape',
  shacl.IRI,
  PropertyShape,
);

createPropertyShape(
  {
    maxCount: 1,
    path: shacl.nodeKind,
    shape: Shape, //actually returns a NamedNode. Queries currently cannot continue after accessing nodeKind
  },
  'nodeKind',
  shacl.IRI,
  PropertyShape,
);

createPropertyShape(
  {
    path: shacl.datatype,
    shape: Shape,
    maxCount: 1,
  },
  'datatype',
  shacl.IRI,
  PropertyShape,
);

//PropertyShape.maxCount
createPropertyShape(
  {
    path: shacl.maxCount,
    datatype: xsd.integer,
    maxCount: 1,
  },
  'maxCount',
  shacl.Literal,
  PropertyShape,
);

//PropertyShape.minCount
createPropertyShape(
  {
    path: shacl.minCount,
    datatype: xsd.integer,
    maxCount: 1,
  },
  'minCount',
  shacl.Literal,
  PropertyShape,
);

//PropertyShape.name
createPropertyShape(
  {
    path: shacl.name,
    maxCount: 1,
  },
  'name',
  shacl.Literal,
  PropertyShape,
);

//PropertyShape.description
createPropertyShape(
  {
    path: shacl.description,
    maxCount: 1,
  },
  'description',
  shacl.Literal,
  PropertyShape,
);

//PropertyShape.inList
