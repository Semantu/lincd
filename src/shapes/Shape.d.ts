import { NamedNode, Node, Quad } from '../models.js';
import { NodeValuesSet } from '../collections/NodeValuesSet.js';
import { NodeSet } from '../collections/NodeSet.js';
import { QuadArray } from '../collections/QuadArray.js';
import { IShape } from '../interfaces/IShape.js';
import { ShapeSet } from '../collections/ShapeSet.js';
import { ICoreIterable } from '../interfaces/ICoreIterable.js';
import { SearchMap } from '../collections/SearchMap.js';
import { CoreSet } from '../collections/CoreSet.js';
import { QuadSet } from '../collections/QuadSet.js';
import { NodeShape, PropertyShape } from './SHACL.js';
import { ShapeValuesSet } from '../collections/ShapeValuesSet.js';
import { GetQueryResponseType, LinkedQuery, PatchedQueryPromise, QueryBuildFn, QueryResponseToResultType } from '../utils/LinkedQuery.js';
import { IStorageController } from '../interfaces/IStorageController.js';
interface IClassConstruct {
    prototype: any;
    new (): any;
}
type AccessPropertiesShape<T extends Shape> = {
    [P in keyof T]: PropertyShape;
};
type PropertyShapeMapFunction<T extends Shape, ResponseType> = (p: AccessPropertiesShape<T>) => ResponseType;
/**
 * The base class of all classes that represent a rdfs:Class in the graph.
 *
 * This class helps form a bridge between the graph (RDF) world & the Object-Oriented typescript world.
 * Each Shape class has a static type property pointing to the rdfs:Class that it represents.
 * Each instance of a class that extends this Shape class points to a single node (NamedNode or Literal), that MUST have this rdfs:Class as its rdf:type in the graph.
 *
 * Classes that extend this class can thereby help simplify interactions with nodes that have a certain rdf:type by replacing low level property access (NamedNode.getAll(), getOne() etc) with high level methods that do not require knowledge of the underlying graph structure.
 *
 * @example
 * An Example:
 * ```tsx
 * @linkedShape
 * class Person extends Shape {
 *  static type = foaf.Person
 *  get friends() {
 *    return this.getAll(foaf.hasFriend)
 *  }
 * }
 *
 * let personNode = NamedNode.getOrCreate();
 * personNode.set(rdf.type,foaf.Person);
 *
 * //creates an instance of the class Person, which points to (represents) personResource.
 * let person = new Person(personNode);
 *
 * //will log all the friends of the personResource (currently none)
 * console.log(person.friends);
 * ```
 */
export declare abstract class Shape implements IShape {
    /**
     * Points to the rdfs:Class that this typescript class represents. Each class extending Shape MUST define this explicitly.
     The appointed NamedNode value must be a rdfs:Class ([value] rdf:type rdfs:Class in the graph)
  
     @example
     An example Shape class that states that all matching nodes must have `rdf:type foaf:Person`.
     ```tsx
     import {foaf} from "./ontologies/foaf";
     @linkedShape
     export class Person extends Shape {
     static targetClass:NamedNode = foaf.Person;
     }
     ```
     */
    static targetClass: NamedNode;
    /**
     * Tracks which types (named nodes) map to which Shapes
     * @internal
     */
    static typesToShapes: Map<NamedNode, CoreSet<IClassConstruct>>;
    static shape: NodeShape;
    protected static instancesLoaded: Map<NamedNode, {
        promise: Promise<NodeSet<NamedNode>>;
        done: boolean;
    }>;
    protected loadPromise: {
        done: boolean;
        promise: Promise<boolean>;
    };
    /**
     * Creates a new instance of this class.
     * If no node is given, a new NamedNode will be generated and it's rdf:type will be set.
     * Only use this constructor directly if you want to create a new node as well.
     * If you want to create an instance of an existing node, use `node.getAs(Class)` or `Class.getOf(node)`
     * @param node
     */
    constructor(node?: Node | any);
    protected _node: Node;
    /**
     * Returns the node this instance represents.
     *
     * Since each node in RDF can have multiple types, each node can have multiple instances (multiple representations of itself reflecting the different things it 'is')
     * But each instance always only represents a single node
     */
    get node(): Node;
    /**
     * returns the rdf:Class that this type of instance represents.
     */
    get nodeShape(): NodeShape;
    /**
     * Returns the NamedNode that this instance represents.
     *
     * Since each node in RDF can have multiple types, each node can have multiple instances (multiple representations of itself reflecting the different things it 'is')
     * But each instance always only represents a single node
     *
     * NOTE: the node of an instance is NOT GUARANTEED to be a NamedNode. There are also instance of Literals.
     * Therefore only use this method if you are certain that the instance you have represents a NamedNode.
     * In that case this method - which works exactly the same as `.node` - simply tells the compiler that the return node is certainly a NamedNode.
     */
    get namedNode(): NamedNode;
    get value(): string;
    get uri(): string;
    get label(): string;
    set label(val: string);
    static create<T extends Shape>(this: ShapeLike<T>, data: Partial<T>, uri?: string): T;
    /**
     * @internal
     * @param shapeClass
     * @param type
     */
    static registerByType(shapeClass: typeof Shape, type?: NamedNode): void;
    /**
     * Get a the matching shape classes that have a targetClass equal to the given type node
     * @internal
     * @param type
     * @param allowSuperClass
     */
    static getClassesForType(type: NamedNode, allowSuperClass?: boolean): CoreSet<typeof Shape>;
    static isValidNode(node: Node): boolean;
    static query<S extends Shape, R = unknown>(this: {
        new (node: Node): S;
        targetClass: any;
    }, queryFn: QueryBuildFn<S, R>): LinkedQuery<S, R>;
    static select<ShapeType extends Shape, S = unknown, ResultType = QueryResponseToResultType<GetQueryResponseType<LinkedQuery<ShapeType, S>>, ShapeType>[]>(this: {
        new (node: Node): ShapeType;
        targetClass: any;
    }, selectFn?: QueryBuildFn<ShapeType, S>): Promise<ResultType> & PatchedQueryPromise<ResultType, ShapeType>;
    static mapPropertyShapes<ShapeType extends Shape, ResponseType = unknown>(this: {
        new (node: Node): ShapeType;
        targetClass: any;
    }, mapFunction?: PropertyShapeMapFunction<ShapeType, ResponseType>): ResponseType;
    static isInstanceOfTargetClass(node: Node): boolean;
    static getInstanceByType<T extends IShape>(node: Node, ...shapes: {
        new (): T;
        targetClass: NamedNode;
        getOf(node: Node): T;
    }[]): T;
    /**
     * Searches instances with the given properties only from the local graph
     * @param properties
     * @param sanitized
     */
    static searchLocal<T extends Shape>(this: {
        new (node: Node): T;
        targetClass: any;
    }, properties: SearchMap, sanitized?: boolean): ShapeSet<T>;
    /**
     * Searches instances with given properties
     * And if results are returned, it returns an instance of the first result, else null
     * @param properties
     */
    static findLocal<T extends Shape>(this: {
        new (node: Node): T;
        targetClass: any;
    }, properties: SearchMap, sanitized?: boolean): T;
    static getLocalInstances<T extends Shape>(this: ShapeLike<T>, explicitInstancesOnly?: boolean): ShapeSet<T>;
    static getNumLocalInstances(): number;
    static getLocalInstanceNodes(explicitInstancesOnly?: boolean): NodeSet;
    /**
     * use new Shape(node) instead, where Shape can be any class that extends Shape
     * @deprecated
     * @param node
     */
    static getOf<T extends Shape>(this: ShapeLike<T>, node: Node): T;
    /**
     * Retrieves an existing node or creates a new (temporary) node and then sets the right rdf:type
     * Then uses that node to return an instance of the Shape that you call this method from
     * So it works just like NamedNode.getOrCreate() but creates an instance of the right shape straight away.
     * Note that if the URI did not yet exist, it creates a temporary node, and hence only once you SAVE that node or shape
     * Will it (and its properties) be stored in permanent storage.
     *
     * @param uri
     * @param isTemporaryNodeIfNew
     */
    static getFromURI<T extends Shape>(this: ShapeLike<T>, uri: string, isTemporaryNodeIfNew?: boolean): T;
    /**
     * Generates a URI from the given prefixURI + optional unique parameters
     * Then returns an instance of this shape with that URI, either from an existing or new node
     * This method is intended to be extended by other shapes.
     * The base implementation in Shape.ts will generate a unique URI if no uniqueParams are given, so extending methods may use super.getFromParams() when no params are given
     * @param prefixURI
     * @param uniqueParams
     */
    static getFromParams<T extends Shape>(this: ShapeLike<T>, prefixURI: string, ...uniqueParams: any[]): T;
    static getSetOf<T extends Shape>(this: ShapeLike<T>, nodes: NodeValuesSet, allowSubShapes?: boolean): ShapeValuesSet<T>;
    static getSetOf<T extends Shape>(this: ShapeLike<T>, nodes: ICoreIterable<Node>, allowSubShapes?: boolean): ShapeSet<T>;
    private static ensureLinkedShape;
    /**
     * Get all values of a certain property as instances of a certain shape.
     * The returned set of shape will automatically update when the property values change in the graph.
     * @param property
     * @param shapeClass
     */
    getAllAs<T extends Shape>(property: NamedNode, shapeClass: typeof Shape, allowSubShapes?: boolean): ShapeValuesSet<T>;
    /**
     * If a value exists for the given property, this returns that value as an instance of the given shape
     * If not, returns null
     * @param property
     * @param shape
     */
    getOneAs<S extends Shape = Shape>(property: any, shape: typeof Shape, allowSubShapes?: boolean): S;
    equals(other: any, checkShapeType?: boolean): boolean;
    /**
     * Makes sure that the node that this instance represents has the right rdf.type
     * Also makes sure that this instance is destructed if the node is removed
     * @internal
     * @param node
     */
    setupNode(node: Node): void;
    /**
     * Destructs the instance. Removes event listeners etc. Overwrite in each subclass of this class that uses custom event listeners
     */
    destruct(): void;
    validate(): boolean;
    getOne(property: NamedNode): Node | null;
    getAll(property: NamedNode): NodeValuesSet | undefined;
    getAllExplicit(property: any): NodeSet;
    getOneFromPath(...properties: NamedNode[]): Node | undefined;
    getAllFromPath(...properties: NamedNode[]): NodeSet;
    getOneInverse(property: NamedNode): NamedNode | null;
    getAllInverse(property: NamedNode): NodeSet<NamedNode> | undefined;
    set(property: NamedNode, value: Node): boolean;
    setValue(property: NamedNode, value: string): boolean;
    mset(property: NamedNode, values: ICoreIterable<Node>): boolean;
    overwrite(property: NamedNode, value: Node): boolean;
    moverwrite(property: NamedNode, values: ICoreIterable<Node>): boolean;
    remove(): void;
    save(): Promise<void>;
    unset(property: NamedNode, value: Node): boolean;
    unsetAll(property: NamedNode): boolean;
    has(property: NamedNode, value: Node): boolean;
    hasValue(property: NamedNode, value: string): boolean;
    hasExplicit(property: NamedNode, value: Node): boolean;
    hasPath(properties: NamedNode[]): boolean;
    hasPathTo(properties: NamedNode[], endPoint?: Node): boolean;
    hasPathToSomeInSet(properties: NamedNode[], endPoints?: ICoreIterable<Node>): boolean;
    /**
     * Checks if the node has a value for this property that is the exact same object as the given value
     * (as opposed to has() which also returns true for equivalent literal values in Literal objects)
     * @param property
     * @param value
     * @returns {boolean}
     */
    hasExact(property: NamedNode, value?: Node): boolean;
    hasProperty(property: NamedNode): boolean;
    hasInverse(property: NamedNode, value?: any): boolean;
    hasInverseProperty(property: NamedNode): boolean;
    getValue(property: NamedNode, language?: string): string | null;
    getProperties(includeFromIncomingArcs?: boolean): NodeSet<NamedNode>;
    getInverseProperties(): any;
    getMultiple(properties: ICoreIterable<NamedNode>): NodeSet;
    getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet;
    getDeep(property: NamedNode, maxDepth?: number): NodeSet;
    getQuads(property: NamedNode, value?: Node): QuadSet;
    getInverseQuads(property: NamedNode): QuadSet;
    getAllInverseQuads(includeImplicit?: boolean): QuadArray;
    getAllQuads(includeAsObject?: boolean, includeImplicit?: boolean): QuadArray;
    /**
     * Returns all quads related to this shape.
     * Overwrite this method to automatically send over quads to the frontend when this shape is sent over
     * This method is used internally by JSONWriter when sending a shape between environments by converting it to JSON & JSON-LD
     * @param includeImplicit
     */
    getDataQuads(includeImplicit?: boolean): Quad[];
    /**
     * Fires the given call back when ANY property of this node changes.
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeAny(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given call back when this node become the value or is no longer the value of another node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeAnyInverse(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given call back when this node changes the values of the given property
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChange(property: NamedNode, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Fires the given callback when this node become the value or is no longer the value of the given property of another node
     * Example: if someGroup hasParticipant thisResource, and the group removes this node from its participants, it will trigger onChangeInverse for this node
     * @param callback the method to be called when the change happens. The quads that have changed + the property that was updated are supplied as parameters
     * @param context give a context to make sure you can easily unset / clear event listeners. Usually you would provide 'this' as context
     */
    onChangeInverse(property: any, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAny events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    removeOnChangeAny(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Make sure to provide the exact same BOUND instance of a method to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    removeOnChangeAnyInverse(callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChange events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChange
     * @param context the same context you supplied to onChange
     */
    removeOnChange(property: NamedNode, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeInverse events. Make sure to provide the exact same BOUND instance of a method as callback to properly clear the listener. OR make sure to provide a context both when setting and clearing the listener.
     * @param callback the exact same method you supplied to onChangeInverse
     * @param context the same context you supplied to onChangeInverse
     */
    removeOnChangeInverse(property: any, callback: (quads?: QuadSet, property?: NamedNode) => void, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeAny events. Other then removeOnChangeAny you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAny
     * @param context the same context you supplied to onChangeAny
     */
    clearOnChangeAny(context: any): void;
    /**
     * Call this when you want to stop listening for onChangeAnyInverse events. Other then removeOnChangeAnyInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeAnyInverse
     * @param context the same context you supplied to onChangeAnyInverse
     */
    clearOnChangeAnyInverse(context: any): void;
    /**
     * Call this when you want to stop listening for onChange events. Other then removeOnChange you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChange
     * @param context the same context you supplied to onChange
     */
    clearOnChange(property: NamedNode, context?: any): void;
    /**
     * Call this when you want to stop listening for onChangeInverse events. Other then removeOnChangeInverse you only have to supply the context.
     * Use this if you no longer have access to the same bound listener function or you're otherwise unable to clear with removeOnChangeInverse
     * @param context the same context you supplied to onChangeAny
     */
    clearOnChangeInverse(property: any, context: any): void;
    /**
     * Call this when you want to stop listening for onPredicateChange events
     * @param context the same context you supplied to onPredicateChange
     */
    clearOnPredicateChange(context: any): void;
    /**
     * Returns true if this instance has the given type as the value of rdf.type
     * Syntactic sugar for this.has(rdf.type,type)
     * @param type
     */
    isa(type: NamedNode): boolean;
    /**
     * Other than NamedNode.promiseLoaded, a Shape will preload whatever data it requires to fulfill the constraints of the shape
     * NOTE: loading is handled by the current StorageController, by default there is no StorageController
     * @param {boolean} loadInverseProperties
     * @returns {Promise<boolean>}
     */
    promiseLoaded(loadInverseProperties?: boolean): Promise<boolean>;
    /**
     * Returns true if this instance has had its promiseLoaded function called and the loading has completed
     * NOTE: will return false if the instance has never loaded, regardless of whether the namedNode it represents is already loaded, and even if this instance would not load anything else
     */
    isLoaded(includingInverseProperties?: boolean): boolean;
    reload(): Promise<boolean>;
    load(loadInverseProperties?: boolean): Promise<boolean>;
    toString(): string;
    print(includeIncomingProperties?: boolean): string;
    /**
     * Returns a new cloned instance with the exact same quads
     * The instance only exists locally (as it's not yet saved)
     * @returns {T}
     */
    clone(): this;
}
interface Constructor<M> {
    new (...args: any[]): M;
}
export interface ShapeLike<M extends Shape> extends Constructor<M> {
    targetClass: NamedNode;
    getSetOf<M extends Shape>(this: ShapeLike<M>, nodes: ICoreIterable<Node>): ShapeSet<M>;
    getFromURI<T extends Shape>(this: ShapeLike<T>, uri: string, isTemporaryNodeIfNew?: boolean): T;
    getLocalInstanceNodes(explicitInstancesOnly?: boolean): NodeSet;
}
export declare class StorageHelper {
    static storageController: IStorageController;
    static query<ResultType = any>(query: LinkedQuery<any>): Promise<ResultType>;
    private static checkSetup;
}
export {};
