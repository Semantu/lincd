/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {BlankNode,Literal,NamedNode,Node} from '../models.js';
import {Shape} from './Shape.js';
import {shacl} from '../ontologies/shacl.js';
import {List} from './List.js';
import {xsd} from '../ontologies/xsd.js';
import {ShapeSet} from '../collections/ShapeSet.js';
import {NodeSet} from '../collections/NodeSet.js';
import {rdf} from '../ontologies/rdf.js';
import {CoreMap} from '../collections/CoreMap.js';
import {ForwardReasoning} from '../utils/ForwardReasoning.js';
import {getShapeClass,getShapeOrSubShape} from '../utils/ShapeClass.js';
import {ShapeValuesSet} from '../collections/ShapeValuesSet.js';
import {rdfs} from '../ontologies/rdfs.js';
import { lincd } from '../ontologies/lincd.js';
import { literalProperty, objectProperty } from '../utils/ShapeDecorators.js';

export class SHACL_Shape extends Shape
{
  static targetClass: NamedNode = shacl.Shape;
  static validating: Set<string> = new Set();

  get type()
  {
    return this.getOne(rdf.type) as NamedNode;
  }

  set type(val: NamedNode)
  {
    this.overwrite(rdf.type,val);
  }

  protected _validateNode(
    node: NamedNode,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean>(),
  ): boolean
  {
    return false;
  }
}

//Note: this shape is linked in Module.ts to avoid cyclical dependencies
export class NodeShape extends SHACL_Shape
{
  static targetClass: NamedNode = shacl.NodeShape;
  private static _instances: ShapeSet<NodeShape>;

  /**
   * Because (currently) all NodeShapes are initialized immediately upon initialisation
   * We can cache the instances of NodeShapes to speed up frequent methods used in Storage
   */
  static get instances()
  {
    if (!this._instances)
    {
      this._instances = this.getLocalInstancesByType();
    }
    return this._instances;
  }

  get targetNode(): NamedNode
  {
    return this.getOne(shacl.targetNode) as NamedNode;
  }

  set targetNode(value)
  {
    this.overwrite(shacl.targetNode,value);
  }

  get targetClass(): NamedNode
  {
    return this.getOne(shacl.targetClass) as NamedNode;
  }

  set targetClass(value)
  {
    this.overwrite(shacl.targetClass,value);
  }

  get properties()
  {
    return this.getPropertyShapes(false);
  }

  get extends(): NodeShape
  {
    return this.getOneAs(lincd.isExtending,NodeShape);
  }

  set extends(value: NodeShape)
  {
    this.overwrite(lincd.isExtending,value.node);
  }

    /**
   * A human-readable description for this shape
   */
    get description()
    {
      return this.getValue(rdfs.comment);
    }
  
    set description(val: string) {
      if (val.length > 220) {
        throw Error(
          `Shape descriptions should stay under 220 characters. ${this.label}.description is ${val.length} chars.`,
        );
      }
      this.overwrite(rdfs.comment, new Literal(val));
    }

  static getShapesOf(node: Node)
  {
    return this.getLocalInstances().filter((shape) => {
      return shape.validateNode(node);
    });
  }

  addPropertyShape(property: PropertyShape)
  {
    this.set(shacl.property,property.namedNode);
  }

  getPropertyShapes(includeSuperClasses: boolean = false): ShapeSet<PropertyShape>
  {
    let res: NodeSet;
    if (includeSuperClasses)
    {
      res = new NodeSet();
      let shapeClass = getShapeClass(this.namedNode).prototype;
      while (shapeClass && shapeClass.nodeShape)
      {
        shapeClass.nodeShape.getAll(shacl.property).forEach(res.add.bind(res));
        shapeClass = Object.getPrototypeOf(shapeClass);
      }
    }
    else
    {
      res = this.getAll(shacl.property);
    }
    return PropertyShape.getSetOf(res);
  }

  getPropertyShape(label: string,checkSubShapes: boolean = true): PropertyShape
  {
    let shapeClass = getShapeClass(this.namedNode)
    let res;
    while (!res && shapeClass)
    {
      res = shapeClass.shape.getPropertyShapes().find((shape) => shape.label === label);
      if(checkSubShapes) {
        //if even Shape didn't have it, then we're done, it's not found.
        if(shapeClass === Shape) {
          break;
        }
        //next, use the super class
        shapeClass = Object.getPrototypeOf(shapeClass);
      } else {
        break;
      }
    }
    return res;
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode>
  {
    let entities = new NodeSet<NamedNode>();
    if (this.targetClass)
    {
      entities.add(this.targetClass);
    }
    //add ontology entities of all property shapes
    this.getPropertyShapes().forEach((propertyShape) => {
      entities = entities.concat(propertyShape.getOntologyEntities());
    });
    return entities;
  }

  validateNode(node: Node): boolean
  {
    return this._validateNode(node);
  }

  validateNodeByType(node: Node): boolean
  {
    return node.has(rdf.type,this.targetClass);
  }

  protected _validateNode(
    node: Node,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean | null>(),
  ): boolean
  {
    if (validated.has(node))
    {
      return validated.get(node);
    }
    
    // Global circular validation prevention
    const validationKey = `${node.toString()}-${this.uri}`;
    if (SHACL_Shape.validating.has(validationKey)) {
      return true; // Assume valid to break circular reference
    }
    
    // Add this validation to the tracking set
    SHACL_Shape.validating.add(validationKey);
    
    try {
      //whilst validating, if a connected node wants to validate THIS node, we consider this node to be valid until proven otherwise below
      validated.set(node,true);

    //EDIT: targetClass is just for selecting nodes. It's not an enforcement, for that shacl:class should be used.
    // if (this.targetClass) {
    //   //NOTE, we're using Reasoning to check types, so that if this node has a type which is a subClassOf the targetClass, it still matches.
    //   //this would not be needed if a Forwards reasoning engine was in place
    //   if (
    //     !(
    //       node instanceof NamedNode &&
    //       ForwardReasoning.hasType(node, this.targetClass)
    //     )
    //   ) {
    //     validated.set(node, false);
    //     return false;
    //   }
    // }
    const propertyShapes = this.getPropertyShapes();
    if (propertyShapes.size > 0)
    {
      if (node instanceof Literal)
      {
        validated.set(node,false);
        return false;
      }
      else if (node instanceof NamedNode)
      {
        if (
          !this.getPropertyShapes().every((propertyShape) => {
            return (propertyShape as any)._validateNode(node,validated);
          })
        )
        {
          validated.set(node,false);
          return false;
        }
      }
    }
    // validated.set(node,true);
    return true;
    } finally {
      // Always clean up the validation tracking
      SHACL_Shape.validating.delete(validationKey);
    }
  }
}

//Note: this shape is linked in Module.ts to avoid cyclical dependencies
export class PropertyShape extends SHACL_Shape
{
  static targetClass: NamedNode = shacl.PropertyShape;

  get class(): NamedNode
  {
    return this.getOne(shacl.class) as NamedNode;
  }

  set class(value: NamedNode)
  {
    this.overwrite(shacl.class,value);
  }

  /**
   * Returns the NodeShape that all value nodes need to conform to
   * On a graph level this accessor returns the value of shacl:node for this PropertyShape (if any)
   * Note: it's named valueShape because node & nodeShape are already used internally in LINCD
   * @see https://www.w3.org/TR/shacl/#NodeConstraintComponent
   *
   */
  //@NOTE: If the name valueShape is an issue we could always rename `get nodeShape` to `get shaclShape` in Shape.ts
  get valueShape(): NodeShape
  {
    return this.hasProperty(shacl.node) ? new NodeShape(this.getOne(shacl.node)) : null;
  }

  set valueShape(value: NodeShape)
  {
    this.overwrite(shacl.node,value.node);
  }

  get nodeKind(): NamedNode
  {
    return this.getOne(shacl.nodeKind) as NamedNode;
  }

  set nodeKind(value: NamedNode)
  {
    this.overwrite(shacl.nodeKind,value);
  }

  get datatype(): NamedNode
  {
    return this.getOne(shacl.datatype) as NamedNode;
  }

  set datatype(value: NamedNode)
  {
    this.overwrite(shacl.datatype,value);
  }

  get maxCount(): number
  {
    return parseInt(this.getValue(shacl.maxCount));
  }

  set maxCount(value: number)
  {
    this.overwrite(shacl.maxCount,new Literal(value.toString(),xsd.integer));
  }

  get minCount(): number
  {
    return parseInt(this.getValue(shacl.minCount));
  }

  set minCount(value: number)
  {
    this.overwrite(shacl.minCount,new Literal(value.toString(),xsd.integer));
  }

  get name(): string
  {
    return this.getValue(shacl.name);
  }

  // Setter overloading - would be nice to have one for String and another for Literal:
  // https://github.com/microsoft/TypeScript/issues/2521
  set name(value: string)
  {
    this.overwrite(shacl.name,new Literal(value));
  }

  get description(): string
  {
    return this.getValue(shacl.description);
  }

  set description(value: string)
  {
    this.overwrite(shacl.description,new Literal(value));
  }

  get path(): NamedNode[]
  {
    let propertyPath = this.getAll(shacl.path);
    // if (propertyPath.size === 1)
    // {
    //   return propertyPath.first() as NamedNode;
    // }
    // else
    // {
      return [...propertyPath] as NamedNode[];
    // }
  }

  set path(value: NamedNode | NamedNode[])
  {
    (value instanceof NamedNode) ? this.overwrite(shacl.path,value) : this.moverwrite(shacl.path,value);
  }

  //@TODO: property decorators should support properties that hold List values
  // Queries should return arrays for these type of values
  get in(): NamedNode
  {
    return this.getOne(shacl.in) as NamedNode;
  }

  set in(value: NamedNode)
  {
    this.overwrite(shacl.in,value);
  }

  get inList(): List
  {
    return this.hasProperty(shacl.in)
      ? List.getOf(this.getOne(shacl.in))
      : null;
  }

  set inList(value: List)
  {
    this.overwrite(shacl.in,value.node);
  }

  get parentNodeShape(): NodeShape
  {
    return this.hasInverseProperty(shacl.property)
      ? new NodeShape(this.getOneInverse(shacl.property))
      : null;
  }

  /**
   * Returns all the classes and properties that are references by this shape
   */
  getOntologyEntities(): NodeSet<NamedNode>
  {
    let pathNodes: NamedNode[];
    if (this.path instanceof NamedNode)
    {
      pathNodes = [this.path];
    }
    else
    {
      pathNodes = this.path;
    }
    //start with values of those properties that have a NamedNode as value
    const entities = new NodeSet<NamedNode>(
      [this.class,...pathNodes,this.datatype].filter((value) => value && true),
    );
    //this caused loops!
    // if (this.nodeShape) {
    //if a node shape is defined, also add all the entities of that node shape
    // entities = entities.concat(this.nodeShape.getOntologyEntities());
    // }
    return entities;
  }

  validateNode(node: NamedNode): boolean
  {
    return this._validateNode(node);
  }

  resolveFor(node: NamedNode)
  {
    //TODO: support more complex property paths
    let path = this.path;
    if (path instanceof NamedNode)
    {
      return node.getAll(path);
    }
    else
    {
      let target: NamedNode | NodeSet = node;
      for (let prop of path)
      {
        target = target.getAll(prop);
      }
      return target;
    }
  }

  protected _validateNode(
    node: NamedNode,
    validated: CoreMap<Node,boolean> = new CoreMap<Node,boolean>(),
  ): boolean
  {
    // Global circular validation prevention
    const validationKey = `${node.uri}__${this.uri}`;
    if (SHACL_Shape.validating.has(validationKey)) {
      return true; // Assume valid to break circular reference
    }
    
    // Add this validation to the tracking set
    SHACL_Shape.validating.add(validationKey);
    
    try {
      const path = this.path;
    let values;
    if (path instanceof NamedNode)
    {
      values = node.getAll(path);
    }
    else
    {
      let target: NamedNode | NodeSet = node;
      for (let prop of path)
      {
        target = target.getAll(prop);
      }
      values = target;
    }
    //validate shacl:class
    if (this.class)
    {
      if (
        !values.every(
          (value) =>
            value instanceof NamedNode && value.has(rdf.type,this.class),
        )
      )
      {
        return false;
      }
    }
    //validate shacl:datatype
    if (this.datatype)
    {
      if (
        !values.every(
          (value) =>
            value instanceof Literal && value.datatype === this.datatype,
        )
      )
      {
        return false;
      }
    }
    //validate shacl:node
    if (this.valueShape)
    {
      //every value should be a valid instance of this nodeShape
      const nodeShape = this.valueShape;
      if (
        !values.every((value) => {
          //nodes referring to each other or to themselves may cause loops here
          //this is currently avoided by keeping track of which nodes have already been validated, during the validation of the root most node
          //TODO: perhaps at some point we may want to store validation results in the shape or even the node, and invalidate whenever the node changes any of its properties. (though for complex property paths that would mean more complex invalidation as well. i.e. back tracing property shapes on a change in node 1 to invalidate a distant node 2)
          if (validated.has(value))
          {
            return validated.get(value);
          }
          
          return (
            (value === node && this.parentNodeShape.equals(nodeShape)) ||
            (nodeShape as any)._validateNode(value,validated)
          );
        })
      )
      {
        return false;
      }
    }
    //validate shacl:minCount
    if (this.minCount)
    {
      if (values.size < this.minCount)
      {
        return false;
      }
    }
    //validate shacl:maxCount
    if (this.maxCount)
    {
      if (values.size > this.maxCount)
      {
        return false;
      }
    }
    return true;
    } finally {
      // Always clean up the validation tracking
      SHACL_Shape.validating.delete(validationKey);
    }
  }
}

export class ValidationResult extends Shape
{
  static targetClass: NamedNode = shacl.ValidationResult;

  @objectProperty({
    path: shacl.focusNode,
    maxCount: 1,
  })
  get focusNode(): Node
  {
    return this.getOne(shacl.focusNode) as Node;
  }

  set focusNode(value: Node)
  {
    this.overwrite(shacl.focusNode,value);
  }

  @objectProperty({
    path: shacl.sourceShape,
    maxCount: 1,
  })
  get sourceShape(): SHACL_Shape
  {
    return getShapeOrSubShape(this.getOne(shacl.sourceShape),SHACL_Shape);
  }

  set sourceShape(value: SHACL_Shape)
  {
    this.overwrite(shacl.sourceShape,value.node);
  }

  @objectProperty({
    path: shacl.resultSeverity,
    maxCount: 1,
  })
  get resultSeverity(): NamedNode
  {
    return this.getOne(shacl.resultSeverity) as NamedNode;
  }

  set resultSeverity(value: NamedNode)
  {
    this.overwrite(shacl.resultSeverity,value);
  }

  @objectProperty({
    path: shacl.resultPath,
    maxCount: 1,
  })
  get resultPath(): NamedNode | NamedNode[]
  {
    let propertyPath = this.getAll(shacl.resultPath);
    if (propertyPath.size === 1)
    {
      return propertyPath.first() as NamedNode;
    }
    else
    {
      return [...propertyPath] as NamedNode[];
    }
  }

  set resultPath(value: NamedNode | NamedNode[])
  {
    (value instanceof NamedNode) ? this.overwrite(shacl.resultPath,value) : this.moverwrite(shacl.resultPath,value);
  }

  @objectProperty({
    path: shacl.value,
    maxCount: 1,
  })
  get validatedValue(): Node
  {
    return this.getOne(shacl.value);
  }

  set validatedValue(value: Node)
  {
    this.overwrite(shacl.value,value);
  }

  @literalProperty({
    path: shacl.message,
    maxCount: 1,
  })
  get message(): string
  {
    return this.getOne(shacl.message).value;
  }

  set message(value: string)
  {
    this.overwrite(shacl.message,new Literal(value));
  }

  get sourceConstraintComponent(): NamedNode
  {
    return this.getOne(shacl.sourceConstraintComponent) as NamedNode;
  }

  set sourceConstraintComponent(value: NamedNode)
  {
    this.overwrite(shacl.sourceConstraintComponent,value);
  }

  static createForNodeAgainstPropertyShape(
    focusNode: NamedNode,
    propertyShape: PropertyShape,
  )
  {
    let validationResult = new ValidationResult();
    validationResult.focusNode = focusNode;
    validationResult.sourceShape = propertyShape;
    validationResult.resultSeverity = shacl.Violation;
    validationResult.resultPath = propertyShape.path;

    let path = propertyShape.path;
    let values;
    if (path instanceof NamedNode)
    {
      values = focusNode instanceof NamedNode ? focusNode.getAll(path) : null;
    }
    else
    {
      if(path.length === 0)
      {
        values = [];
      }
      else
      {
        values = focusNode;
        for (let prop of path)
        {
          values = values.getAll(prop);
        }
      }
    }
    for (let value of values)
    {
      //validate shacl:class
      if (propertyShape.class)
      {
        if (
          !(
            value instanceof NamedNode &&
            value.has(rdf.type,propertyShape.class)
          )
        )
        {
          validationResult.validatedValue = value;
          validationResult.message = `Value does not have the required class ${propertyShape.class.uri}`;
          validationResult.sourceConstraintComponent =
            shacl.ClassConstraintComponent;
          return validationResult;
        }
      }
      //validate shacl:datatype
      if (propertyShape.datatype)
      {
        if (
          !(
            value instanceof Literal &&
            value.datatype === propertyShape.datatype
          )
        )
        {
          validationResult.validatedValue = value;
          validationResult.message = `Value does not have the required datatype ${propertyShape.datatype.uri}`;
          validationResult.sourceConstraintComponent =
            shacl.DatatypeConstraintComponent;
          return validationResult;
        }
      }
      //validate shacl:node
      if (propertyShape.valueShape)
      {
        //every value should be a valid instance of propertyShape nodeShape
        let nodeShape = propertyShape.valueShape;
        //TODO: / NOTE: for validation else where in this file we save validation results to avoid infinite loops
        // we don't do that yet here, so we may get loops when shapes refer to each other
        let valueIsSelf = value === focusNode && propertyShape.parentNodeShape.equals(nodeShape);
        if (
          !valueIsSelf && !(nodeShape as any)._validateNode(value)
        )
        {
          //get extra information why the value doesn't match the shape
          let valueReport = ValidationReport.forNodeAgainstShape(value,nodeShape);

          validationResult.sourceConstraintComponent =
            shacl.NodeConstraintComponent;
          validationResult.validatedValue = value;
          validationResult.message = `Value does not conform to the required shape ${propertyShape.valueShape.uri}:\n\t${valueReport.toString().replace(/\n/g,'\n\t')}`;
          return validationResult;
        }
      }
    }
    //validate shacl:minCount
    if (propertyShape.minCount)
    {
      if (values.size < propertyShape.minCount)
      {
        validationResult.message = `Minimum ${
          propertyShape.minCount
        } values required for ${propertyShape.path.toString()}. But only ${
          values.size
        } values were found`;
        validationResult.sourceConstraintComponent =
          shacl.MinLengthConstraintComponent;
        return validationResult;
      }
    }
    //validate shacl:maxCount
    if (propertyShape.maxCount)
    {
      if (values.size > propertyShape.maxCount)
      {
        validationResult.message = `Maximum ${
          propertyShape.maxCount
        } values allowed for  ${propertyShape.path.toString()}. But ${
          values.size
        } values were found`;
        validationResult.sourceConstraintComponent =
          shacl.MaxLengthConstraintComponent;
        return validationResult;
      }
    }
    return null;
  }

  toString(): string
  {
    let result = '';
    // if(this.sourceShape) {
    //   result += '\tSource Shape:\t'+this.sourceShape.uri + '\n';
    // }
    let resultPathStr = '';
    let resultPath = this.resultPath;
    if (resultPath instanceof NamedNode)
    {
      resultPathStr = resultPath.uri;
    }
    else
    {
      resultPathStr = resultPath.map((path) => path.uri).join(' -> ');
    }
    if (this.focusNode)
    {
      result += '\tFocus Node:\t' + this.focusNode.toString() + '\n';
    }
    if (this.resultPath)
    {
      result += '\tPath:\t\t' + resultPathStr + '\n';
    }
    if (this.validatedValue)
    {
      result += '\tValue:\t' + this.validatedValue.toString() + '\n';
    }
    if (this.sourceConstraintComponent)
    {
      result += '\tConstraint:\t' + this.sourceConstraintComponent.uri + '\n';
    }
    if (this.message)
    {
      result += '\tMessage:\t' + this.message + '\n';
    }
    if (this.resultSeverity)
    {
      result += '\tSeverity:\t' + this.resultSeverity.uri + '\n';
    }
    return result;
  }
}

export class ValidationReport extends Shape
{
  static targetClass: NamedNode = shacl.ValidationReport;
  static validating: CoreMap<string,ValidationReport> = new CoreMap<string,ValidationReport>();

  @literalProperty({
    path: shacl.conforms,
    datatype: xsd.boolean,
  })
  get conforms(): boolean
  {
    return this.getValue(shacl.conforms) === 'true';
  }

  set conforms(val: boolean)
  {
    this.overwrite(shacl.conforms,new Literal(val ? 'true' : 'false',xsd.boolean));
  }

  @objectProperty({
    path: shacl.result,
    shape: ValidationResult,
  })
  get validationResults(): ShapeValuesSet<ValidationResult>
  {
    return ValidationResult.getSetOf(
      this.getAll(shacl.result),
    ) as ShapeValuesSet<ValidationResult>;
  }

  /**
   * From the SHACL spec: https://www.w3.org/TR/shacl/#validation-definition
   * Validation of a focus node against a shape: Given a focus node in the data graph and a shape in the shapes graph, the validation results are the union of the results of the validation of the focus node against all constraints declared by the shape, unless the shape has been deactivated, in which case the validation results are empty.
   * @param focusNode
   * @param shape
   */
  static forNodeAgainstShape(
    focusNode: Node,
    shape: NodeShape,
  ): ValidationReport
  {
    const validationKey = `${focusNode.value}__${shape.uri}`;
    if (ValidationReport.validating.has(validationKey)) {
      return ValidationReport.validating.get(validationKey);
    }
    
    ValidationReport.validating.set(validationKey,new ValidationReport());
    try {
      let report = new ValidationReport();
      report.conforms = shape.validateNode(focusNode);
      if (shape.targetClass)
      {
        //NOTE, we're using Reasoning to check types, so that if this node has a type which is a subClassOf the targetClass, it still matches.
        //this would not be needed if a Forwards reasoning engine was in place
        if (
          !(
            focusNode instanceof NamedNode &&
            ForwardReasoning.hasType(focusNode,shape.targetClass)
          )
        )
        {
          // let validationResult = new ValidationResult();
          // validationResult.focusNode = focusNode;
          // validationResult.sourceShape = shape;
          // validationResult.message = `Value does not have the required class ${propertyShape.class.uri}`;
          // validationResult.sourceConstraintComponent = shacl.ClassConstraintComponent;
          // report.validationResults.add(validationResult);
          console.log(
            `${focusNode.toString()} does not have target type: ${
              shape.targetClass.uri
            }. Although it's not a SHACL validation error, it does mean this node will not be selected when getting instances of the ${
              shape.label
            } shape.}`,
          );
        }
      }
      if (report.conforms)
      {
        return report;
      }

      let propertyShapes = shape.getPropertyShapes();
      if (propertyShapes.size > 0)
      {
        if (focusNode instanceof Literal)
        {
          //literals can not match NodeShapes (?)
          //TODO: this is not fully standard compliant? for now we do a custom message to match the way LINCD does it
          let validationResult = new ValidationResult();
          validationResult.focusNode = focusNode;
          validationResult.sourceShape = shape;
          validationResult.message =
            'A literal currently cannot be a valid instance of a NodeShape.';
          report.validationResults.add(validationResult);
          // return false;
        }
        else if (focusNode instanceof NamedNode)
        {
          propertyShapes.forEach((propertyShape) => {
            let validationResult =
              ValidationResult.createForNodeAgainstPropertyShape(
                focusNode,
                propertyShape,
              );
            if (validationResult)
            {
              report.validationResults.add(validationResult);
            }
          });
        }
      }
      return report;
    } finally {
      ValidationReport.validating.delete(validationKey);
    }
  }

  static printForShapeInstances(shape: typeof Shape)
  {
    let potentialNodes = shape.targetClass.getAllInverse(rdf.type);
    console.log(
      'Checking ' +
      potentialNodes.size +
      ' instances of ' +
      shape.targetClass.uri,
    );
    let allConfirm = true;
    potentialNodes.forEach((node) => {
      let report = ValidationReport.forNodeAgainstShape(node,shape.shape);
      if (!report.conforms)
      {
        console.log(report.toString());
        allConfirm = false;
      }
    });
    if (allConfirm)
    {
      console.log('All instances conform to the shape');
    }
  }

  toString()
  {
    let str = `ValidationReport:`;
    if (this.conforms)
    {
      str += ` valid shape`;
    }
    else
    {
      str += '\n' + this.validationResults.size + ' validation results:\n';
      this.validationResults.forEach((validationResult) => {
        str += validationResult.toString();
      });
    }
    return str;
  }
}

//
// let lincdPackage = linkedPackage('lincd');
// lincdPackage.linkedShape(NodeShape);
// lincdPackage.linkedShape(PropertyShape);
//
// //ALL the following is to support Shape having get/set methods with property shapes
// //and Shape itself having a nodeShape
// //if we dont need Shape to have get/set methods (like label and type) then this can be removed
// Shape.shape = NodeShape.getFromURI('http://lincd/Shape');
// addNodeShapeToShapeClass(Shape.shape,Shape);
//
// //Here we can register the properties of the Shape class itself
// //We can't do that inside of Shape because it would cause circular dependencies
// registerPropertyShape(Shape.shape,createPropertyShape({
//     path: rdfs.label,
//   },
//   'label',
//   shacl.Literal,
// ));
// registerPropertyShape(Shape.shape,createPropertyShape(
//   {
//     path: rdf.type,
//   },
//   'type',
// ));

