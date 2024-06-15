import { NamedNode } from '../models.js';
import { Shape } from '../shapes/Shape.js';
import { LinkedComponentFactoryFn, LinkedSetComponentFactoryFn } from '../utils/LinkedComponent.js';
export declare const LINCD_DATA_ROOT: string;
/**
 * a map of requested property shapes for specific nodes
 * The value is a promise if it's still loading, or true if it is fully loaded
 */
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
     * import {LinkedComponentClass} from "lincd/utils/ComponentClass";
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
     * import {NamedNode} from 'lincd/models';
     * import {JSONLD} from 'lincd-jsonld/lib/JSONLD';
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
    linkedOntology: (allFileExports: any, nameSpace: (term: string) => NamedNode, suggestedPrefixAndFileName: string, loadDataFunction?: () => Promise<any>, dataSource?: string | string[]) => void;
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
    registerPackageModule(_module: any): void;
}
export declare var DEFAULT_LIMIT: number;
export declare function setDefaultPageLimit(limit: number): void;
export declare function autoLoadOntologyData(value: boolean): void;
export declare function linkedPackage(packageName: string): LinkedPackageObject;
export declare function initTree(): void;
