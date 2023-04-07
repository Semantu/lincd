/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {EventEmitter} from '../events/EventEmitter';
import {Literal,NamedNode,Node} from '../models';
import {rdf} from '../ontologies/rdf';
import {NodeValuesSet} from '../collections/NodeValuesSet';
import {rdfs} from '../ontologies/rdfs';
import {NodeSet} from '../collections/NodeSet';
import {QuadArray} from '../collections/QuadArray';
import {Find} from '../utils/Find';
import {IShape} from '../interfaces/IShape';
import {ShapeSet} from '../collections/ShapeSet';
import {ICoreIterable} from '../interfaces/ICoreIterable';
import {SearchMap} from '../collections/SearchMap';
import {CoreSet} from '../collections/CoreSet';
import {QuadSet} from '../collections/QuadSet';
import {NodeShape} from './SHACL';
import {LinkedDataDeclaration,LinkedDataResponse,LinkedDataSetDeclaration} from '../interfaces/Component';
import {ShapeValuesSet} from '../collections/ShapeValuesSet';

declare var dprint: (item,includeIncomingProperties?: boolean) => void;

interface IClassConstruct
{
  new(): any;

  prototype: any;
}

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
export abstract class Shape extends EventEmitter implements IShape
{
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
  static targetClass: NamedNode = null;

  /**
   * Tracks which types (named nodes) map to which Shapes
   * @internal
   */
  static typesToShapes: Map<NamedNode,CoreSet<IClassConstruct>> = new Map();
  //TODO: rename to nodeShape to avoid confusing things like shape.shape
  static shape: NodeShape;

  protected _node: Node;
  protected static instancesLoaded: Map<NamedNode,{promise: Promise<NodeSet<NamedNode>>;done: boolean}> = new Map();
  protected loadPromise: {done: boolean;promise: Promise<boolean>};

  /**
   * Creates a new instance of this class.
   * If no node is given, a new NamedNode will be generated and it's rdf:type will be set.
   * Only use this constructor directly if you want to create a new node as well.
   * If you want to create an instance of an existing node, use `node.getAs(Class)` or `Class.getOf(node)`
   * @param node
   */
  constructor(node?: Node | any)
  {
    super();
    this.setupNode(node);
  }

  /**
   * returns the rdf:Class that this type of instance represents.
   */
  get nodeShape(): NodeShape
  {
    return (this.constructor as typeof Shape).shape;
    // if (this.constructor['targetClass'])
    // {
    //   return this.constructor['targetClass'];
    // }
    // throw new Error('The constructor of this instance has not defined a static targetClass.');
  }

  /**
   * Get all values of a certain property as instances of a certain shape.
   * The returned set of shape will automatically update when the property values change in the graph.
   * @param property
   * @param shapeClass
   */
  getAllAs<T extends Shape>(
    property:NamedNode,
    shapeClass:typeof Shape
  ): ShapeValuesSet<T>
  {
    return new ShapeValuesSet<T>(this.namedNode,property,shapeClass as any);
  }

  /**
   * If a value exists for the given property, this returns that value as an instance of the given shape
   * If not, returns null
   * @param property
   * @param shape
   */
  getOneAs<S extends Shape = Shape>(property,shape:typeof Shape):S {
    return this.hasProperty(property) ? new (shape as any)(this.getOne(property)) as S : null;
  }


  equals(other) {
    return other instanceof Shape && other.node === this.node && Object.getPrototypeOf(other) === Object.getPrototypeOf(this);
  }

  /**
   * @internal
   * @param shapeClass
   * @param type
   */
  static registerByType(shapeClass: typeof Shape,type?: NamedNode)
  {
    if (!type)
    {
      if(shapeClass === Shape) {
        return;
      }
      //TODO: add support for sh:targetNode, sh:targetObjectsOf and sh:targetSubjectsOf. Those would be fine as alternatives to targetClass (and the latter 2 define a PropertyShape)
      //warn developers against a common mistake: if no static shape is set by the Component it will inherit the one of the class it extends
      if (!shapeClass.hasOwnProperty('targetClass'))
      {
        console.warn(
          `Shape ${shapeClass.name} is not linked to a targetClass. Please define 'static targetClass:NamedNode'`,
        );
        return;
      }
      type = shapeClass.targetClass;
    }

    //save in a map for finding the Shape back based on the type
    if (!this.typesToShapes.has(type))
    {
      this.typesToShapes.set(type,new CoreSet());
    }
    this.typesToShapes.get(type).add(shapeClass as any);
  }

  /**
   * Get a the matching shape classes that have a targetClass equal to the given type node
   * @internal
   * @param type
   * @param allowSuperClass
   */
  static getClassesForType(type: NamedNode,allowSuperClass: boolean = false): CoreSet<typeof Shape>
  {
    let instanceClasses = this.typesToShapes.get(type);
    if (allowSuperClass)
    {
      let subClasses = type.getDeep(rdfs.subClassOf) as any;
      // subClasses = Order.typesByDepth(subClasses);
      subClasses.delete(type); //<-- only delete after ordering, as it will be a new set and not the original PropertySet
      subClasses.forEach((subViewType) => {
        if (this.typesToShapes.has(subViewType))
        {
          instanceClasses = instanceClasses.concat(this.typesToShapes.get(subViewType));
        }
      });
    }
    return instanceClasses as any as CoreSet<typeof Shape>;
  }

  /**
   * Makes sure that the node that this instance represents has the right rdf.type
   * Also makes sure that this instance is destructed if the node is removed
   * @internal
   * @param node
   */
  setupNode(node: Node)
  {
    if (node)
    {
      if (!(node instanceof Node))
      {
        console.error('Invalid argument to constructor of shape:',node);
        throw new Error('Invalid argument provided to constructor of shape. Please provide an instance of a node.');
      }
      this._node = node;
    }
    else
    {
      //this code gets triggered when you call new SomeShapeClass() without providing a node
      //some classes prefer a certain term type. E.g. RdfsLiteral will create a Literal node, and NodeShape will create a BlankNode
      //TODO: also look at inheritance chain, so that a class without preferredNodeKind that extends a class with preferredTermType still gets that inherited termType
      let termType = this.constructor['nodeKind'] || this.constructor['preferredNodeKind'] || NamedNode;

      //create a new temporary node, a Literal, NamedNode or BlankNode
      this._node = termType.create(true);

      let nodeShape = this.nodeShape;
      if(nodeShape && nodeShape.targetClass)
      {
        this._node.set(rdf.type,nodeShape.targetClass);
      }
    }

    //@TODO: do this for RdfsLiteral as well if they implement events at some point?
    if (this._node instanceof NamedNode)
    {
      this._node.on(NamedNode.NODE_REMOVED,this.destruct.bind(this));
    }
  }

  /**
   * Destructs the instance. Removes event listeners etc. Overwrite in each subclass of this class that uses custom event listeners
   */
  destruct()
  {
    if (this._node instanceof NamedNode)
    {
      this._node.removeAllListeners();
    }
  }

  validate():boolean {
    return this.nodeShape?.validateNode(this.node) || false;
  }

  static isValidNode(node:Node) {
    this.ensureLinkedShape();
    return this.shape.validateNode(node);
  }
  /**
   * Lets a LinkedComponent request specific data of a shape.
   *
   * @param dataRequestFn this function receives a dummy instance of the shape. The function is expected to request all the properties & methods of the shape that the component requires to function. This will inform automatic data loading
   */
  static request<T extends Shape>(
    this: {new(node: Node): T;targetClass: any},
    dataRequestFn: (shapeInstance: T) => LinkedDataResponse,
  ): LinkedDataDeclaration<T>
  {
    //calling this method like this so that we can keep it private without having to add it to the 'this' interface
    this['ensureLinkedShape']();

    //return an object with the shape and a request key. The value of request is a function
    //that can be executed for a specific instance of the shape
    return {
      shape: this as any as typeof Shape,
      request: (shapeInstance) => {
        return dataRequestFn(shapeInstance);
      },
    };
  }

  /**
   * Lets a LinkedComponent request specific data of a shape.
   *
   * @param dataRequestFn this function receives a dummy instance of the shape. The function is expected to request all the properties & methods of the shape that the component requires to function. This will inform automatic data loading
   */
  static requestSet<T extends Shape>(
    this: {new(node: Node): T;targetClass: any},
    dataRequestFn: (shapeSet: ShapeSet<T>) => LinkedDataResponse,
  ): LinkedDataSetDeclaration<T>
  {
    //calling this method like this so that we can keep it private without having to add it to the 'this' interface
    this['ensureLinkedShape']();

    //return an object with the shape and a request key. The value of request is a function
    //that can be executed for a set of instances of the shape
    return {
      shape: this as any as typeof Shape,
      setRequest: (shapeSet) => {
        return dataRequestFn(shapeSet);
      },
    };
  }

  static requestForEachInSet<T extends Shape>(
    this: {new(node: Node): T;targetClass: any},
    dataRequestFn: (shape: T) => LinkedDataResponse,
  ): LinkedDataSetDeclaration<T>
  {
    //calling this method like this so that we can keep it private without having to add it to the 'this' interface
    this['ensureLinkedShape']();
    
    //return an object with the shape and a request key. The value of request is a function
    //that can be executed for a specific instance of the shape
    return {
      shape: this as any as typeof Shape,
      request: (shape) => {
        return dataRequestFn(shape);
      },
    };
  }
  
  private static ensureLinkedShape() {
    if(!this.shape) {
      console.warn(this.name+" is not a linked shape. Did you forget to use the @linkedShape decorator?")
    }
  }

  /**
   * Returns the node this instance represents.
   *
   * Since each node in RDF can have multiple types, each node can have multiple instances (multiple representations of itself reflecting the different things it 'is')
   * But each instance always only represents a single node
   */
  get node(): Node
  {
    //Instances of rdfs:Literal overwrite this method to return literalResource instead
    return this._node;
  }

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
  get namedNode(): NamedNode
  {
    //Instances of rdfs:Literal will return null so we can just return the node as is here, and use this method for type casting
    return this._node as NamedNode;
  }


  getOne(property: NamedNode): Node | null
  {
    return this._node.getOne(property);
  }

  getAll(property: NamedNode): NodeValuesSet | undefined
  {
    return (this._node as NamedNode).getAll(property);
  }


  getAllExplicit(property): NodeSet
  {
    return (this._node as NamedNode).getAllExplicit(property);
  }

  getOneFromPath(...properties: NamedNode[]): Node | undefined
  {
    return this.node.getOneFromPath(...properties);
  }

  getAllFromPath(...properties: NamedNode[]): NodeSet
  {
    return this.node.getAllFromPath(...properties);
  }

  getOneInverse(property: NamedNode): NamedNode | null
  {
    return this._node.getOneInverse(property);
  }

  getAllInverse(property: NamedNode): NodeSet<NamedNode> | undefined
  {
    return this._node.getAllInverse(property);
  }

  set(property: NamedNode,value: Node)
  {
    return this._node.set(property,value);
  }

  setValue(property: NamedNode,value: string)
  {
    return this._node.setValue(property,value);
  }

  mset(property: NamedNode,values: ICoreIterable<Node>): boolean
  {
    return this._node.mset(property,values);
  }

  overwrite(property: NamedNode,value: Node)
  {
    return this._node.overwrite(property,value);
  }

  moverwrite(property: NamedNode,values: ICoreIterable<Node>)
  {
    return this._node.moverwrite(property,values);
  }

  remove()
  {
    return this.namedNode.remove();
  }

  save()
  {
    return this.namedNode.save();
  }

  unset(property: NamedNode,value: Node): boolean
  {
    return this._node.unset(property,value);
  }

  unsetAll(property: NamedNode): boolean
  {
    return this._node.unsetAll(property);
  }

  has(property: NamedNode,value: Node): boolean
  {
    return this._node.has(property,value);
  }

  hasValue(property: NamedNode,value: string): boolean
  {
    return this._node.hasValue(property,value);
  }

  hasExplicit(property: NamedNode,value: Node): boolean
  {
    return this._node.hasExplicit(property,value);
  }

  hasPath(properties: NamedNode[]): boolean
  {
    return this._node.hasPath(properties);
  }

  hasPathTo(properties: NamedNode[],endPoint?: Node): boolean
  {
    return this._node.hasPathTo(properties,endPoint);
  }

  hasPathToSomeInSet(properties: NamedNode[],endPoints?: ICoreIterable<Node>): boolean
  {
    return this._node.hasPathToSomeInSet(properties,endPoints);
  }

  /**
   * Checks if the node has a value for this property that is the exact same object as the given value
   * (as opposed to has() which also returns true for equivalent literal values in Literal objects)
   * @param property
   * @param value
   * @returns {boolean}
   */
  hasExact(property: NamedNode,value: Node = null): boolean
  {
    return this._node.hasExact(property,value);
  }

  hasProperty(property: NamedNode): boolean
  {
    return this._node.hasProperty(property);
  }

  hasInverse(property: NamedNode,value: any = null): boolean
  {
    return this._node.hasInverse(property,value);
  }

  hasInverseProperty(property: NamedNode): boolean
  {
    return this._node.hasInverseProperty(property);
  }

  getValue(property: NamedNode,language: string = ''): string | null
  {
    return (this._node as NamedNode).getValue(property,language);
  }

  getProperties(includeFromIncomingArcs: boolean = false): NodeSet<NamedNode>
  {
    return this._node.getProperties(includeFromIncomingArcs);
  }

  getInverseProperties()
  {
    return this._node.getInverseProperties();
  }

  getMultiple(properties: ICoreIterable<NamedNode>): NodeSet
  {
    return this._node.getMultiple(properties);
  }

  getMultipleInverse(properties: ICoreIterable<NamedNode>): NodeSet
  {
    return this._node.getMultipleInverse(properties);
  }

  getDeep(property: NamedNode,maxDepth?: number): NodeSet
  {
    return this._node.getDeep(property,maxDepth);
  }

  getQuads(property: NamedNode,value?: Node): QuadSet
  {
    return this._node.getQuads(property,value);
  }

  getInverseQuads(property: NamedNode): QuadSet
  {
    return this._node.getInverseQuads(property);
  }

  getAllInverseQuads(includeImplicit?: boolean): QuadArray
  {
    return this._node.getAllInverseQuads(includeImplicit);
  }

  getAllQuads(includeAsObject: boolean = false,includeImplicit: boolean = false): QuadArray
  {
    return this._node.getAllQuads(includeAsObject,includeImplicit);
  }

  //TODO: move to rdfs:Resource or owl:Thing shape? (and decide which one of those we want to promote)
  get label()
  {
    return this.getValue(rdfs.label);
  }

  set label(val: string)
  {
    this.overwrite(rdfs.label,new Literal(val));
  }

  //TODO: move to rdfs:Resource or owl:Thing shape? (and decide which one of those we want to promote)
  get type()
  {
    return this.getOne(rdf.type) as NamedNode;
  }

  set type(val: NamedNode)
  {
    this.overwrite(rdf.type,val);
  }

  /**
   * Returns true if this instance has the given type as the value of rdf.type
   * Syntactic sugar for this.has(rdf.type,type)
   * @param type
   */
  isa(type: NamedNode)
  {
    return this.has(rdf.type,type);
  }

  static isInstanceOfTargetClass(node: Node)
  {
    return node.has(rdf.type,this.targetClass);
  }

  static getInstanceByType<T extends IShape>(
    node: Node,
    ...shapes: {new(): T;targetClass: NamedNode;getOf(node: Node): T}[]
  ): T
  {
    let matchingShape = shapes.find((shape) => {
      return node.has(rdf.type,shape.targetClass);
    });
    if (matchingShape)
    {
      return matchingShape.getOf(node);
    }
  }

  /**
   * Other than NamedNode.promiseLoaded, a Shape will preload whatever data it requires to fulfill the constraints of the shape
   * NOTE: loading is handled by the current StorageController, by default there is no StorageController
   * @param {boolean} loadInverseProperties
   * @returns {Promise<boolean>}
   */
  promiseLoaded(loadInverseProperties: boolean = false): Promise<boolean>
  {
    if (!this.loadPromise)
    {
      let promise = this.load(loadInverseProperties);
      this.loadPromise = {
        done: false,
        promise: promise,
      };
      promise.then((res) => {
        this.loadPromise.done = true;
        return res;
      });
    }
    return this.loadPromise.promise;
  }

  /**
   * Returns true if this instance has had its promiseLoaded function called and the loading has completed
   * NOTE: will return false if the instance has never loaded, regardless of whether the namedNode it represents is already loaded, and even if this instance would not load anything else
   */
  isLoaded(includingInverseProperties: boolean = false): boolean
  {
    return this.node instanceof NamedNode ? this.namedNode.isLoaded(includingInverseProperties) : true;
  }

  reload(): Promise<boolean>
  {
    this.loadPromise = null;
    return this.promiseLoaded();
  }

  load(loadInverseProperties: boolean = false): Promise<boolean>
  {
    if (!this.namedNode) return Promise.resolve(true);

    //load the node itself
    return this.namedNode.promiseLoaded(loadInverseProperties).then(() => {
      //make sure the reasoner has run on the loaded properties
      // return Reasoning.promiseComplete();
      return null;
    });
  }

  toString()
  {
    return '[' + this.node + ' as ' + this.constructor.name + ']';
  }

  print(includeIncomingProperties: boolean = true)
  {
    // return Debug.print(this.node,includeIncomingProperties);
    return `${this.constructor.name} of ${this.node.print()}`;

    // typeof (typeof window !== 'undefined' ? window['dprint'] : global.dprint)(this, includeIncomingProperties);
  }

  /**
   * Returns a new cloned instance with the exact same quads
   * The instance only exists locally (as it's not yet saved)
   * @returns {T}
   */
  clone(): this
  {
    let prototype = Object.getPrototypeOf(this);
    return new prototype(this.node.clone()) as this;
  }

  /**
   * Searches instances with the given properties only from the local graph
   * @param properties
   * @param sanitized
   */
  static searchLocal<T extends Shape>(
    this: {new(node: Node): T;targetClass: any},
    properties: SearchMap,
    sanitized: boolean = false,
  ): ShapeSet<T>
  {
    let quads = Find.byPropertyValues(properties,this.targetClass,true,true,sanitized);

    let set = new ShapeSet<T>();
    for (var node of quads.getSubjects())
    {
      set.add(new this(node));
    }
    return set;
  }

  /**
   * Searches instances with given properties
   * And if results are returned, it returns an instance of the first result, else null
   * @param properties
   */
  static findLocal<T extends Shape>(
    this: {new(node: Node): T;targetClass: any},
    properties: SearchMap,
    sanitized: boolean = false,
  ): T
  {
    let results = (this as any).searchLocal(properties,sanitized);
    if (results.size > 0)
    {
      return results.first();
    }
  }

  static getLocalInstances<T extends Shape>(this: ShapeLike<T>,explicitInstancesOnly: boolean = false): ShapeSet<T>
  {
    //'this' is listed as a parameter ti be able to return a set of instances with the type of the actual class that extends Shape
    // https://www.typescriptlang.org/docs/handbook/generics.html#using-class-types-in-generics
    // https://stackoverflow.com/questions/34098023/typescript-self-referencing-return-type-for-static-methods-in-inheriting-classe?rq=1
    return this.getSetOf(this.getLocalInstanceNodes());
  }

  //TODO: to find Shape instances we need to not just check type, but all the constraints of this shape class
  static getNumLocalInstances(): number
  {
    return this.getLocalInstanceNodes().size;
  }

  static getLocalInstanceNodes(explicitInstancesOnly: boolean = false): NodeSet
  {
    //start by getting a list of all nodes that have the correct type
    let potentialInstances;
    if (explicitInstancesOnly)
    {
      potentialInstances = this.targetClass
        .getInverseQuads(rdf.type)
        .filter((quad) => !quad.implicit)
        .getSubjects();
    }
    else
    {
      potentialInstances = this.targetClass.getAllInverse(rdf.type);
    }
    //return only those instance nodes that are actual valid instances of this shape
    return potentialInstances.filter(node => this.isValidNode(node));
  }

  /**
   * use new Shape(node) instead, where Shape can be any class that extends Shape
   * @deprecated
   * @param node
   */
  static getOf<T extends Shape>(this: ShapeLike<T>,node: Node): T
  {
    return new this(node);
  }

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
  static getFromURI<T extends Shape>(this: ShapeLike<T>,uri: string,isTemporaryNodeIfNew:boolean=true): T
  {
    let node = NamedNode.getNamedNode(uri);
    if (node)
    {
      return new this(node);
    }
    else
    {
      node = NamedNode.getOrCreate(uri,true);
      if(this.targetClass)
      {
        node.set(rdf.type,this.targetClass);
      }
      return new this(node);
    }
    return new this(NamedNode.getOrCreate(uri));
  }

  /**
   * Generates a URI from the given prefixURI + optional unique parameters
   * Then returns an instance of this shape with that URI, either from an existing or new node
   * This method is intended to be extended by other shapes.
   * The base implementation in Shape.ts will generate a unique URI if no uniqueParams are given, so extending methods may use super.getFromParams() when no params are given
   * @param prefixURI
   * @param uniqueParams
   */
  static getFromParams<T extends Shape>(this: ShapeLike<T>,prefixURI:string,...uniqueParams: any[]): T {
    let postfix;
    if(uniqueParams.length)
    {
      postfix = uniqueParams.join('/');
    }
    else
    {
      //here we expect that we'll create a new node, so the counter will be increased when we actually create it
      postfix = NamedNode.getCounter()+1;
    }
    let uri = prefixURI + this.targetClass.uri + '/' + postfix;
    return this.getFromURI(uri);
  }

  static getSetOf<T extends Shape>(this: ShapeLike<T>,nodes: NodeValuesSet): ShapeValuesSet<T>;
  static getSetOf<T extends Shape>(this: ShapeLike<T>,nodes: ICoreIterable<Node>): ShapeSet<T>;
  static getSetOf<T extends Shape>(this: ShapeLike<T>,nodes: NodeValuesSet|ICoreIterable<Node>): ShapeSet<T>|ShapeValuesSet<T>
  {
    if (!nodes)
    {
      throw new Error('No nodes provided to create shape instances of');
    }

    if(nodes instanceof NodeValuesSet && nodes.subject instanceof NamedNode)
    {
      return new ShapeValuesSet(nodes.subject,nodes.property,this as any);
    }
    return new ShapeSet<T>(nodes.map(node => new this(node)));
  }
}

//The types below are used to create static methods that return an instance of this class it is called from.
//E.G. Shape defines getFrom, and Class extends Shape, and Class.getFrom returns a Class.
//To do that, we need the declarations below
// is from https://www.typescriptlang.org/docs/handbook/generics.html#using-class-types-in-generics
interface Constructor<M>
{
  new(...args: any[]): M;
}

export interface ShapeLike<M extends Shape> extends Constructor<M>
{
  targetClass: NamedNode;

  getSetOf<M extends Shape>(this: ShapeLike<M>,nodes: ICoreIterable<Node>): ShapeSet<M>;
  getFromURI<T extends Shape>(this: ShapeLike<T>,uri: string,isTemporaryNodeIfNew?:boolean): T
  getLocalInstanceNodes(explicitInstancesOnly?: boolean): NodeSet;
}
