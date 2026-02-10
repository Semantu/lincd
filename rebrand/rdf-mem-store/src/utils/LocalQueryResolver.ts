import {
  ArgPath,
  ComponentQueryPath,
  CustomQueryObject,
  Evaluation,
  GetQueryResponseType,
  JSPrimitive,
  NodeResultMap,
  PropertyQueryStep,
  QResult,
  QueryArg,
  QueryBuilderObject,
  QueryPath,
  QueryPrimitiveSet,
  QueryResponseToEndValues,
  QueryStep,
  SelectQuery,
  SelectQueryFactory,
  SizeStep,
  SortByPath,
  SubQueryPaths,
  WhereAndOr,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
} from '@_linked/core/queries/SelectQuery';
import {ShapeSet} from '@_linked/core/collections/ShapeSet';
import {Shape} from '@_linked/core/shapes/Shape';
import {shacl} from '@_linked/core/ontologies/shacl';
import {CoreMap} from '@_linked/core/collections/CoreMap';
import {UpdateQuery} from '@_linked/core/queries/UpdateQuery';
import {
  checkNewCount,
  isSetModificationValue,
  NodeDescriptionValue,
  NodeReferenceValue,
  ShapeReferenceValue,
  SinglePropertyUpdateValue,
  UpdateNodePropertyValue,
} from '@_linked/core/queries/QueryFactory';
import {Literal, NamedNode} from '../models.js';
import {xsd} from '@_linked/core/ontologies/xsd';
import {PropertyShape} from '@_linked/core/shapes/SHACL';
import {rdf} from '@_linked/core/ontologies/rdf';
import {NodeSet} from '../collections/NodeSet.js';
import {CreateQuery} from '@_linked/core/queries/CreateQuery';
import {DeleteQuery, DeleteResponse} from '@_linked/core/queries/DeleteQuery';
import {toNamedNode} from './toNamedNode.js';
import {getSubShapesClasses} from '@_linked/core/utils/ShapeClass';

const primitiveTypes: string[] = ['string', 'number', 'boolean', 'Date'];

/**
 * Convert a property path from core's NodeReferenceValue format to NamedNode(s).
 */
function toPropertyPath(path: {id: string} | {id: string}[]): NamedNode | NamedNode[] {
  if (Array.isArray(path)) {
    return path.map(p => toNamedNode(p));
  }
  return toNamedNode(path);
}

/**
 * Find all instances of a type (and its subtypes) in the global graph.
 * Replaces Shape.getLocalInstancesByType() which doesn't exist in core.
 */
function getInstancesByType(shapeClass: {targetClass?: {id: string}}): NodeSet<NamedNode> {
  if (!shapeClass.targetClass) {
    return new NodeSet();
  }
  const typeNode = toNamedNode(shapeClass.targetClass);
  const rdfType = toNamedNode(rdf.type);
  let nodes = typeNode.getAllInverse(rdfType) || new NodeSet();
  // Also get instances of subtypes
  try {
    getSubShapesClasses(shapeClass as any).forEach((sub: any) => {
      if (sub.targetClass) {
        const subNodes = toNamedNode(sub.targetClass).getAllInverse(rdfType);
        if (subNodes) {
          subNodes.forEach((n: any) => nodes.add(n));
        }
      }
    });
  } catch (e) {
    // getSubShapesClasses may not work for all shape types
  }
  return nodes as NodeSet<NamedNode>;
}

/**
 * Convert a ShapeSet to a NodeSet by looking up each shape's id as a NamedNode.
 * Replaces ShapeSet.getNodes() which doesn't exist in core.
 */
function shapeSetToNodeSet(set: ShapeSet): NodeSet<NamedNode> {
  const nodes = new NodeSet<NamedNode>();
  set.forEach((s: any) => nodes.add(NamedNode.getOrCreate(s.id)));
  return nodes;
}

export type ProcessedWhereEvaluationPath = WhereEvaluationPath & {
  processedArgs: any[];
};

export async function createLocal<ResultType>(
  query: CreateQuery<ResultType>,
): Promise<ResultType> {
  if (query.type === 'create') {
    //convert the description of the node to create just like in update(),
    // but this time there is no parent propertyShape, so we use null
    //this will also set the rdf:type and save() the node.
    const {value, plainValue} = await convertNodeDescription(
      null,
      query.description,
      true,
    );
    return plainValue;
  } else {
    throw new Error('Unknown query type: ' + query.type);
  }
}

export async function deleteLocal(query: DeleteQuery): Promise<DeleteResponse> {
  if (query.type === 'delete') {
    const response: DeleteResponse = {
      deleted: [],
      count: 0,
    };
    const errors: Record<string, string> = {};
    const failed = [];
    query.ids.forEach((id) => {
      let subject;
      try {
        subject = convertNodeReferenceOrId(null, id);
      } catch (err) {
        let idString =
          typeof id === 'string'
            ? id
            : id?.id
              ? id.id
              : id && id['uri']
                ? id['uri']
                : '';
        if (idString === '') {
          errors[Object.keys(errors).length] = 'Invalid id: ' + id;
          failed.push(id);
        } else {
          errors[idString] = 'Could not find node with id: ' + idString;
          failed.push(idString);
        }
        return;
      }
      if (!subject.value) {
        errors[subject.plainValue.id] =
          'No node found with id: ' + subject.plainValue.id;
        failed.push(subject.plainValue.id);
        return;
      }
      //remove the node from the graph
      subject.value.remove();
      response.deleted.push(subject.plainValue.id);
      response.count++;
    });
    if (failed.length > 0) {
      response.failed = failed;
      response.errors = errors;
    }
  } else {
    throw new Error('Invalid query type: ' + query.type);
  }
  return null;
}

export async function updateLocal<ResultType>(
  query: UpdateQuery<ResultType>,
): Promise<ResultType> {
  if (query.type === 'update') {
    let subject = NamedNode.getNamedNode(query.id);
    if (!subject) {
      throw new Error('No subject found for id: ' + query.id);
    }
    // let shapeClass = getShapeClass(query.shape.namedNode);
    // let shape = new (shapeClass as any)(subject);
    let plainResults = await applyFieldUpdates(query.updates.fields, subject);
    plainResults['id'] = query.id;
    return plainResults as ResultType;
  } else {
    throw new Error('Invalid query type: ' + query.type);
  }
}

async function applyFieldUpdates(
  fields: UpdateNodePropertyValue[],
  subject: NamedNode,
  createQuery: boolean = false,
) {
  let plainValues = {};
  for (let field of fields) {
    let propShape = field.prop;
    let propertyPath = toPropertyPath(propShape.path);

    if (typeof field.val === 'undefined') {
      unsetPropertyPath(subject, propertyPath);
      if (propShape.maxCount >= 1) {
        //when clearing a single property we return undefined
        plainValues[propShape.label] = undefined;
      } else {
        plainValues[propShape.label] = [];
        //when clearing a set of values we return an empty array
      }
    } else if (Array.isArray(field.val)) {
      checkNewCount(propShape, field.val.length);

      let values = [];
      let plainValueArr = [];
      //see check above, we already know it's an array, so we can cast it
      for (let singleVal of field.val as SinglePropertyUpdateValue[]) {
        let res = await convertValue(propShape, singleVal, createQuery);
        plainValueArr.push(res.plainValue);
        values.push(res.value);
      }
      if (values.every((v) => typeof v === 'undefined')) {
        //clearing a property
        plainValues[propShape.label] = undefined;
        unsetPropertyPath(subject, propertyPath);
      } else if (values.some((v) => typeof v === 'undefined')) {
        throw new Error(
          'Invalid use of undefined for property: ' +
            propShape.label +
            '. You cannot mix undefined with defined values. Values given:' +
            values.map((v) => v?.toString()).join(', '),
        );
      } else {
        // For multi-value properties, return updatedTo structure if this is an UPDATE query (if it's a CREATE query we just return the array)
        plainValues[propShape.label] = createQuery
          ? plainValueArr
          : {updatedTo: plainValueArr};
        overwritePropertyPathMultipleValues(subject, propertyPath, values);
      }
    } else if (isSetModificationValue(field.val)) {
      //check if the new UPDATED number of properties would be allowed
      //by getting the current values, and counting how many remain after adding/removing values
      const currentValues = getPropertyPath(subject, propertyPath);
      const numCurrentValues = currentValues.size;
      const numFinalValues =
        numCurrentValues +
        (field.val.$add ? field.val.$add.length : 0) -
        (field.val.$remove ? field.val.$remove.length : 0);
      checkNewCount(propShape, numFinalValues);

      //prepare object to keep track of the plain values that are added and removed
      const plainUpdates: {added?; removed?} = {};

      if (field.val.$remove) {
        let removedPlainValues = [];
        //remove the values from the property path
        field.val.$remove.forEach((val) => {
          //convert the node reference value to a real node
          let nodeToRemove = convertNodeReference(propShape, val, '$remove');
          //keep track of what's removed
          removedPlainValues.push(nodeToRemove.plainValue);
          //remove the value from the property path
          unsetPropertyPathValue(subject, propertyPath, nodeToRemove.value);
        });
        plainUpdates.removed = removedPlainValues;
      }
      if (field.val.$add) {
        let addedPlainValues = [];
        //add the values to the property path
        let values = [];
        for (let singleVal of field.val.$add) {
          //convert the value (which can be a node reference or a node description)
          let res = await convertValue(propShape, singleVal, createQuery);
          //keep track of what's added
          addedPlainValues.push(res.plainValue);
          values.push(res.value);
        }
        //add the new values to the set of values at the end of the path
        addToResultSets(subject, propertyPath, values);
        //if all that went well, keep track of the added values
        plainUpdates.added = addedPlainValues;
      }
      plainValues[propShape.label] = plainUpdates;
    } else {
      //single value is provided
      //check if that fits with the maxCount and minCount of the property
      checkNewCount(propShape, 1);

      let res = await convertValue(
        propShape,
        (field as UpdateNodePropertyValue).val,
        createQuery,
      );

      // if(typeof res.value === 'undefined') {
      //   unsetPropertyPath(subject,propertyPath);
      //   plainValues[propShape.label] = undefined;
      // } else {
      //save the plain value for the result
      plainValues[propShape.label] = res.plainValue;
      //Note, we are using SET here, to ADD a value.
      //If there are multiple values possible and the user wants to overwrite all the values,
      //they need to use an update function instead of an update object
      overwritePropertyPathSingleValue(subject, propertyPath, res.value);
      // }
    }
  }

  return plainValues;
}

function getPropertyPath(
  subject: NamedNode,
  path: NamedNode | NamedNode[],
): NodeSet<NamedNode> {
  if (Array.isArray(path)) {
    let target: NodeSet = new NodeSet([subject]);
    for (let p of path) {
      target = target.getAll(p);
    }
    return target as NodeSet<NamedNode>;
  } else {
    return subject.getAll(path) as any as NodeSet<NamedNode>;
  }
}

function addToResultSets(
  subject: NamedNode,
  path: NamedNode | NamedNode[],
  values: NamedNode[],
) {
  if (Array.isArray(path)) {
    //save the last property, that's the one we want to add values to
    let lastPath = path.pop();
    let target: NamedNode | NodeSet = new NodeSet([subject]);
    //for the remaining parts, follow the path to the end
    for (let p of path) {
      target = target.getAll(p);
    }
    //for each node in the target nodes, add the values with the last property from the path as predicate
    //the existing quads with this subject and predicate will remain, and the new values will be added to the graph
    target.msetEach(lastPath, values);
  } else {
    //if it's a single property, we can just add the values with the given path as predicate
    //the existing quads with this subject and predicate will remain, and the new values will be added to the graph
    subject.mset(path as NamedNode, values);
  }
}

function overwritePropertyPathMultipleValues(
  subject: NamedNode,
  path: NamedNode | NamedNode[],
  values: NamedNode[],
) {
  if (Array.isArray(path)) {
    //NOTE: for now we are removing the entire path, not just the last part of the path
    // Not sure yet if we need to distinguish between the two
    console.warn(
      `Overwriting each end values in property path (${path.map((p) => p.uri).join(' -> ')}) with multiple values ${values.map((v) => v.uri).join(', ')}. Is that expected behaviour?`,
    );

    let lastPath = path.pop();
    let target: NodeSet = new NodeSet([subject]);
    for (let p of path) {
      target = target.getAll(p);
    }

    (target as NodeSet).forEach((node) => {
      node.moverwrite(lastPath, values);
    });
  } else {
    subject.moverwrite(path as NamedNode, values);
  }
}

function overwritePropertyPathSingleValue(
  subject: NamedNode,
  path: NamedNode | NamedNode[],
  value: NamedNode | Literal,
) {
  if (Array.isArray(path)) {
    //NOTE: for now we are removing the entire path, not just the last part of the path
    // Not sure yet if we need to distinguish between the two
    console.warn(
      `Overwriting each end values in property path (${path.map((p) => p.uri).join(' -> ')}) with single value ${value.toString()}. Is that expected behaviour? `,
    );

    let lastPath = path.pop();
    let target: NamedNode | NodeSet = subject;
    for (let p of path) {
      target = target.getAll(p);
    }

    (target as NodeSet).forEach((node) => {
      node.overwrite(lastPath, value);
    });
  } else {
    subject.overwrite(path as NamedNode, value);
  }
}

function unsetPropertyPathValue(
  subject: NamedNode,
  path: NamedNode | NamedNode[],
  value: NamedNode | Literal,
) {
  if (Array.isArray(path)) {
    //NOTE: for unsetting a specific value we are just unsetting the final connection NOT the entire path
    console.warn(
      `Unsetting each end value in property path (${path.map((p) => p.uri).join(' -> ')}) with value ${value.toString()}. Is that expected behaviour? `,
    );

    let lastPath = path.pop();
    let target: NodeSet = new NodeSet([subject]);
    for (let p of path) {
      target = target.getAll(p);
    }

    target.forEach((node) => {
      node.unset(lastPath, value);
    });
  } else {
    subject.unset(path as NamedNode, value);
  }
}

function unsetPropertyPath(subject: NamedNode, path: NamedNode | NamedNode[]) {
  if (Array.isArray(path)) {
    //NOTE: for now we are removing the last part of the path, disconnecting the end values from the subject at the final property of the path
    // If we need to remove the entire path this should likely be done with other structures, like a ItemListElement being dependent on having an item defined and automatically being removed when we remove the item
    console.warn(
      'Unsetting the final property-value pair of the property path. Is that expected behaviour? : ' +
        path.map((p) => p.uri).join(' -> '),
    );

    let lastPath = path.pop();
    let targets: NodeSet = new NodeSet([subject]);
    for (let p of path) {
      targets = targets.getAll(p);
    }
    targets.forEach((node) => {
      node.unsetAll(lastPath);
    });
  } else {
    subject.unsetAll(path);
  }
}

async function convertValue(
  propShape: PropertyShape,
  value: any,
  createQuery: boolean = false,
): Promise<{value: Literal | NamedNode; plainValue: any}> {
  const nkId = propShape.nodeKind?.id;
  if (nkId === shacl.Literal.id) {
    return convertLiteral(propShape, value);
  } else if (
    nkId === shacl.BlankNodeOrIRI.id ||
    nkId === shacl.BlankNode.id ||
    nkId === shacl.IRI.id
  ) {
    return await convertNamedNode(propShape, value, createQuery);
  } else {
    //we currently don't support other node kinds, like shacl.BlankNodeOrLiteral and shacl.BlankNodeOrIRI
    //so in this case, we allow all types of values,
    //next we look at datatype and shapeValue to determine the correct type of value
    if (propShape.datatype) {
      return convertLiteral(propShape, value);
    } else if (propShape.valueShape) {
      return await convertNamedNode(propShape, value, createQuery);
    }
    //these are clearly meant to be literals
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date ||
      typeof value === 'string'
    ) {
      return convertLiteral(propShape, value);
    }
    //arrays mean it's an array of field+value objects
    else if (Array.isArray(value)) {
      return await convertNamedNode(propShape, value as any, createQuery);
    }
    throw new Error('Unknown value type for property: ' + propShape.label);
  }
}

function convertNamedNode(
  propShape: PropertyShape,
  value: NodeDescriptionValue | NodeReferenceValue,
  createQuery: boolean = true,
): Promise<{
  value: NamedNode;
  plainValue: any;
}> {
  //value is expected to be an array of fields, or an object with an id for a direct node reference
  if (isNodeReference(value)) {
    return Promise.resolve(
      convertNodeReference(propShape, value as NodeReferenceValue),
    );
  } else {
    return convertNodeDescription(
      propShape,
      value as NodeDescriptionValue,
      createQuery,
    );
  }
}

function isNodeReference(
  value: NodeReferenceValue | NodeDescriptionValue,
): value is NodeReferenceValue {
  //check if the value is an object with an id field
  //NOTE: all objects with an id key are considered node references
  //and all other properties are ignored
  //to DEFINE the ID of a new node, the user should use __id as a key in the object
  return typeof value === 'object' && value !== null && 'id' in value;
  // && Object.keys(value).length === 1;
  //and check if there is only 1 key in the object
}

function convertNodeReferenceOrId(
  propShape: PropertyShape,
  value: NodeReferenceValue,
  suffixKey?: string,
): {value: NamedNode; plainValue: any} {
  if (typeof value === 'string') {
    return {
      value: NamedNode.getNamedNode(value),
      plainValue: {id: value},
    };
  }
  return convertNodeReference(propShape, value, suffixKey);
}

function convertNodeReference(
  propShape: PropertyShape,
  value: NodeReferenceValue,
  suffixKey?: string,
): {value: NamedNode; plainValue: any} {
  if (!value.id) {
    throw new Error(
      'Expected a node reference for property: ' +
        propShape?.label +
        (suffixKey ? '.' + suffixKey : ''),
    );
  }
  //if other keys are present
  if (Object.keys(value).length > 1) {
    throw new Error(
      'Invalid value for property: ' +
        propShape.label +
        (suffixKey ? '.' + suffixKey : '') +
        '. A node reference should only contain the id field.',
    );
  }
  //NOTE: changed this to getOrCreate. Which means also unknown id's will be converted to a named node
  //We need this for example when we load shapes in one app of another app, and the shapes are not yet defined in the graph
  return {
    value: NamedNode.getOrCreate((value as NodeReferenceValue).id),
    //return an object only with the ID (a NodeReferenceValue should always only have an id field)
    plainValue: {id: (value as NodeReferenceValue).id},
  };
}

async function convertNodeDescription(
  propShape: PropertyShape,
  value: NodeDescriptionValue,
  createQuery: boolean = false,
): Promise<{value: NamedNode; plainValue: any}> {
  if (!value.shape || !value.fields) {
    throw new Error(
      'Expected a node description for property: ' + propShape?.label,
    );
  }

  //use the provided id as URI or create a new node if not defined
  let node = value.__id
    ? NamedNode.getOrCreate(value.__id)
    : NamedNode.create();
  let plainResults = await applyFieldUpdates(value.fields, node, createQuery);

  let valueShape = propShape?.valueShape || value.shape;
  //if this property comes with a restriction that all values need to be of a certain shape
  if (valueShape && 'targetClass' in valueShape && valueShape.targetClass) {
    //then we set the type of the node to the target class
    //this is a "free" automatic property that we set for the user, so they don't need to always manually type it into the create() or update() queries
    node.set(toNamedNode(rdf.type), toNamedNode(valueShape.targetClass));
  }

  //mark as non-temporary so save() is a no-op in local-only context
  //data is already in the global graph from set()/overwrite() calls above
  node.isTemporaryNode = false;
  plainResults['id'] = node.uri;

  return {
    value: node,
    plainValue: plainResults,
  };
}

function convertLiteral(
  propShape: PropertyShape,
  value: any,
): {value: Literal; plainValue: any} {
  if (typeof value === 'object' && !(value instanceof Date)) {
    throw new Error(
      'Object values are not allowed for property: ' + propShape.label,
    );
  }
  let datatype = propShape.datatype;
  let res: Literal;
  if (datatype) {
    const dtId = (datatype as any).id ?? datatype;
    if (dtId === xsd.integer.id) {
      if (typeof value === 'number') {
        res = new Literal(value.toString(), toNamedNode(xsd.integer));
      } else {
        throw new Error(
          `Property ${propShape.parentNodeShape.label}.${propShape.label} has datatype xsd.integer, so it expects a number value. Given value: ` +
            JSON.stringify(value) +
            ' of type: ' +
            typeof value,
        );
      }
    } else if (dtId === xsd.boolean.id) {
      if (typeof value === 'boolean') {
        res = Boolean_toLiteral(value);
      } else {
        throw new Error(
          `Property ${propShape.parentNodeShape.label}.${propShape.label} has datatype xsd.boolean, so it expects a boolean value. Given value: ` +
            JSON.stringify(value) +
            ' of type: ' +
            typeof value,
        );
      }
    } else if (dtId === xsd.string.id) {
      res = new Literal(value.toString(), toNamedNode(xsd.string));
    } else if (dtId === xsd.date.id || dtId === xsd.dateTime.id) {
      //check if value is a date
      if (value instanceof Date) {
        res = XSDDate_fromNativeDate(value, datatype);
      } else {
        throw new Error(
          `Property ${propShape.parentNodeShape.label}.${propShape.label} has datatype xsd.dateTime, so it expects a Date value. Given value: ` +
            JSON.stringify(value) +
            ' of type: ' +
            typeof value,
        );
      }
    } else {
      console.warn(
        `Unknown datatype :${datatype.toString()}. Assuming it's a string value`,
      );
    }
  }
  if (typeof value === 'undefined') {
    return {
      value: undefined,
      plainValue: undefined,
    };
  }
  if (value === null) {
    throw new Error(
      'Value cannot be null. If you want to unset a value, use undefined',
    );
  }
  //if none of the previous options matched (and therefor res is not set yet), then we assume the value is a string
  if (!res) {
    if (typeof value !== 'string') {
      throw new Error(
        `Property ${propShape.parentNodeShape.label}.${propShape.label} has no datatype defined in its decorator, so it expects a string value. Given value: ` +
          JSON.stringify(value) +
          ' of type: ' +
          typeof value,
      );
    }
    //and we convert the string to a literal
    //Note: datatype could be null or any other unsupported datatype
    res = new Literal(value, datatype ? toNamedNode(datatype) : null);
  }
  return {
    value: res,
    plainValue: value,
  };
}

/**
 * Resolves the query locally, by searching the graph in local memory, without using stores.
 * Returns the result immediately.
 * The results will be the end point reached by the query
 */
export function resolveLocal<ResultType>(
  query: SelectQuery,
  // shape: typeof Shape,
): ResultType {
  //TODO: review if we need the shape here or if we can get it from the query
  // if(!shape) {
  //   shape = query.subject
  // }

  let subject: NamedNode | NodeSet<NamedNode>;
  if (query.subject) {
    if ('id' in (query.subject as QResult<any>)) {
      if (typeof (query.subject as QResult<any>).id !== 'string') {
        throw new Error(
          'When providing a subject in a query, the id must be a string. Given: ' +
            JSON.stringify((query.subject as QResult<any>).id),
        );
      }
      if (NamedNode.getNamedNode((query.subject as QResult<any>).id)) {
        // subject = query.shape.getFromURI((query.subject as QResult<any>).id) as Shape;
        subject = NamedNode.getOrCreate((query.subject as QResult<any>).id);
      } else {
        return null;
      }
    } else if (query.subject instanceof ShapeSet) {
      subject = shapeSetToNodeSet(query.subject as ShapeSet);
    } else {
      subject = NamedNode.getOrCreate((query.subject as any).id);
    }
  } else {
    subject = getInstancesByType(query.shape);
  }
  // let subject2 = query.subject ? query.subject : query.shape.getLocalInstancesByType();
  // console.log(ValidationReport.printForShapeInstances(query.shape));

  //filter the instances down based on the where clause
  if (query.where) {
    subject = filterResults(subject, query.where);
  }
  //sort the instances before slicing
  if (query.sortBy) {
    subject = sortResults(subject, query.sortBy);
  }
  //slice the instances based on the limit and offset
  if (query.limit && subject instanceof NodeSet) {
    subject = subject.slice(
      query.offset || 0,
      (query.offset || 0) + query.limit,
    );
  }

  let resultObjects;
  if (query.subject instanceof ShapeSet) {
    resultObjects = nodesToResultObjects(subject as NodeSet<NamedNode>);
  } else if (query.subject instanceof Shape) {
    resultObjects = shapeToResultObject(subject as NamedNode);
  } else if (query.subject && query.subject.id) {
    //when a query subject is given as an object with an id, probably from a previous query result
    resultObjects = {
      id: query.subject.id,
      // shape: query.shape,
    };
  } else {
    //no specific subject is given, so subjects will be a NodeSet of filtered instances,
    resultObjects = nodesToResultObjects(subject as NodeSet<NamedNode>);
  }

  //SELECT - go over the select path and resolve the values
  if (Array.isArray(query.select)) {
    query.select.forEach((queryPath) => {
      resolveQueryPath(subject, queryPath, resultObjects);
    });
  } else {
    const r = (singleShape) =>
      resolveCustomObject(
        singleShape,
        query.select as CustomQueryObject,
        resultObjects instanceof Map
          ? resultObjects.get(singleShape.uri)
          : resultObjects,
      );
    query.subject ? r(subject) : (subject as NodeSet).map(r);
  }
  const results = (
    resultObjects instanceof Map ? [...resultObjects.values()] : resultObjects
  ) as ResultType;

  if (query.singleResult) {
    return Array.isArray(results) ? results[0] : results as ResultType;
  }
  return results;
}

/**
 * resolves each key of the custom query object
 * and writes the result to the resultObject with the same keys
 * @param subject
 * @param query
 * @param resultObject
 */
function resolveCustomObject(
  subject: NamedNode,
  query: CustomQueryObject,
  resultObject: QResult<any, any>,
) {
  for (let key of Object.getOwnPropertyNames(query as CustomQueryObject)) {
    let result = resolveQueryPath(subject, query[key]);
    writeResultObject(resultObject, key, result);
  }
  return resultObject;
}

function writeResultObject(resultObject, key, result) {
  //convert undefined to null, because JSON.stringify will KEEP keys that have a null value. Which is required for LINCD to work properly with nested queries
  if (typeof result === 'undefined') {
    result = null;
  }
  //if this key was already set
  if (key in resultObject) {
    //if both the existing value and the new value are objects, we can merge them
    if (
      result &&
      resultObject[key] &&
      typeof result === 'object' &&
      typeof resultObject[key] === 'object'
    ) {
      resultObject[key] = {...resultObject[key], ...result};
      return;
    } else if (result && result[key] !== null) {
      console.warn(
        'Overwriting existing value for key: ' +
          key +
          ' in result object. Existing value: ' +
          JSON.stringify(resultObject[key]) +
          ', new value: ' +
          JSON.stringify(result),
      );
    }
  }
  resultObject[key] = result;
}

export function resolveLocalEndResults<S extends SelectQueryFactory<any>>(
  query: S,
  subject?: NodeSet<NamedNode> | NamedNode,
  queryPaths?: CustomQueryObject | ComponentQueryPath[],
): QueryResponseToEndValues<GetQueryResponseType<S>> {
  queryPaths = queryPaths || query.getQueryPaths();
  subject = subject || (query.shape as any).getLocalInstances();
  let results = [];

  if (Array.isArray(queryPaths)) {
    queryPaths.forEach((queryPath) => {
      results.push(resolveQueryPathEndResults(subject, queryPath));
    });
  } else {
    throw new Error(
      'TODO: implement support for custom query object: ' + queryPaths,
    );
  }

  // convert the result of each instance into the shape that was requested
  if (query.traceResponse instanceof QueryBuilderObject) {
    //even though resolveQueryPaths always returns an array, if a single value was requested
    //we will return the first value of that array to match the request
    return results.shift();
    //map((result) => {
    //return result.shift();
    //});
  } else if (Array.isArray(query.traceResponse)) {
    //nothing to convert if an array was requested
    return results as any;
  } else if (
    // query.traceResponse instanceof QueryValueSetOfSets ||
    query.traceResponse instanceof SelectQueryFactory
  ) {
    return results.shift();
  } else if (
    query.traceResponse instanceof QueryPrimitiveSet ||
    query.traceResponse instanceof Evaluation
  ) {
    //TODO: see how traceResponse is made for QueryValue. Here we need to return an array of the first item in the results?
    //does that also work if there is multiple values?
    //do we need to check the size of the traceresponse
    //why is a CoreSet created? start there
    return results.length > 0 ? ([...results[0]] as any) : ([] as any);
  } else if (typeof query.traceResponse === 'object') {
    throw new Error('Objects are not yet supported');
  }
}

function resolveQueryPath(
  subject: NamedNode | NodeSet<NamedNode>,
  queryPath: QueryPath | ComponentQueryPath,
  resultObjects?: NodeResultMap | QResult<any, any>,
) {
  //start with the local instance as the subject
  if (Array.isArray(queryPath)) {
    //if the queryPath is an array of query steps, then resolve the query steps and let that convert the result
    return resolveQuerySteps(subject, queryPath as any[], resultObjects);
  } else {
    if (subject instanceof NamedNode) {
      return evaluate(subject, queryPath as WherePath);
    }
    return (subject as NodeSet<NamedNode>).map((node) => {
      return evaluate(node, queryPath as WherePath);
    });
  }
}

function resolveQueryPathEndResults(
  subject: NodeSet<NamedNode> | NamedNode,
  queryPath: QueryPath | ComponentQueryPath,
) {
  //start with the local instance as the subject
  let result: NodeSet<NamedNode> | NamedNode[] | NamedNode | boolean[] =
    subject;
  if (Array.isArray(queryPath)) {
    for (let queryStep of queryPath) {
      //then resolve each of the query steps and use the result as the new subject for the next step
      result = resolveQueryStepEndResults(
        result as NodeSet<NamedNode> | NamedNode,
        queryStep,
      );
      if (!result) {
        break;
      }
    }
  } else {
    result = (subject as NodeSet<NamedNode>).map((singleNode) => {
      return evaluate(singleNode, queryPath as WherePath);
    });
  }
  //return the final value at the end of the path
  return result as
    | NodeSet<NamedNode>
    | NamedNode[]
    | NamedNode
    | JSPrimitive
    | JSPrimitive[];
}

function evaluateWhere(node: NamedNode, method: string, args: any[]): boolean {
  let filterMethod: Function;
  if (method === WhereMethods.EQUALS) {
    filterMethod = resolveWhereEquals;
  } else if (method === WhereMethods.SOME) {
    filterMethod = resolveWhereSome;
  } else if (method === WhereMethods.EVERY) {
    filterMethod = resolveWhereEvery;
  } else {
    throw new Error('Unimplemented where method: ' + method);
  }
  return filterMethod.apply(null, [node, ...args]);
}

function sortResults(
  subject: NodeSet<NamedNode> | NamedNode,
  sortBy: SortByPath,
) {
  if (subject instanceof NamedNode) return subject;

  //SORTING - how it works
  //If a query is sorted by 2 paths (e.g. sort by lastName then by firstName), it will first sort by the first, then by the second if the first one didn't give a result

  let ascending = sortBy.direction === 'ASC';
  let sorted = [...subject].sort((a, b) => {
    //go over each sort path (sortBy contains an array with 1 or more paths to sort by)
    for (let sortPath of sortBy.paths) {
      //resolve the value of the sort path for both a and b
      let aValue = resolveQueryPathEndResults(a, sortPath);
      let bValue = resolveQueryPathEndResults(b, sortPath);
      //if the values are different, we can return the result
      if (aValue < bValue) {
        return ascending ? -1 : 1;
      }
      if (aValue > bValue) {
        return ascending ? 1 : -1;
      }
      //else sort by the next path
    }
    //if we reach the end of the loop, then the values are equal by all paths
    return 0;
  });
  return new NodeSet(sorted);
}

/**
 * Filters down the given subjects to only those what match the where clause
 * @param subject
 * @param where
 * @private
 */
function filterResults(
  subject: NodeSet<NamedNode> | NamedNode,
  where: WherePath,
  resultObjects?: NodeResultMap,
): NodeSet<NamedNode> | NamedNode {
  // if ((where as WhereEvaluationPath).path) {
  //for nested where clauses the subject will already be a QueryValue
  //TODO: check if subject is ever not a shape, shapeset or string

  //we're about to remove values from the subject set, so we need to clone it first so that we don't alter the graph
  if (subject instanceof NodeSet) {
    subject = subject.clone() as NodeSet<NamedNode>;
    subject.forEach((node) => {
      if (!evaluate(node, where)) {
        resultObjects?.delete(node.uri);
        (subject as NodeSet<NamedNode>).delete(node);
      }
    });
    return subject;
  } else if (subject instanceof NamedNode) {
    return evaluate(subject, where as WhereEvaluationPath)
      ? subject
      : undefined;
  } else if (typeof subject === 'string') {
    return evaluate(subject, where as WhereEvaluationPath)
      ? subject
      : undefined;
  } else if (typeof subject === 'undefined') {
    //this can happen when comparing literals, and there is no value
    return undefined;
  } else {
    throw Error('Unknown subject type: ' + subject);
  }
}

/**
 * Pre-processes the where clause to resolve the args if it is a path with args
 * This prevents the need to resolve the args multiple times when evaluating the where clause
 * @param where
 */
function preProcessWhere(where: WhereEvaluationPath): any[] {
  //if the where clause is a path, we need to resolve the args
  if (where.path && where.args) {
    (where as ProcessedWhereEvaluationPath).processedArgs = resolveWhereArgs(
      where.args,
    );
    return (where as ProcessedWhereEvaluationPath).processedArgs;
  }
  return [];
}

function resolveWhereArgs(args: QueryArg[]) {
  if (!args || !Array.isArray(args)) {
    return [];
  }
  return args.map((arg) => {
    //if this is an argpath
    if ((arg as ArgPath).path && !(arg as WhereEvaluationPath).args) {
      //in this case we need to follow the path to the end value
      if (!(arg as ArgPath).subject) {
        //if this happens, we probably need to NOT pre-process the where clause for args coming from the main query (as opposed to args from query context)
        throw new Error(
          'Expected a subject for arg path: ' + JSON.stringify(arg),
        );
      }
      const node = NamedNode.getNamedNode((arg as ArgPath).subject.id);
      if (!node) {
        return [];
      }
      // const shapeClass = getShapeClass(node);
      // const shape = (shapeClass as ShapeType).getFromURI((arg as ArgPath).subject.id) as Shape;
      return resolveQueryPath(node, (arg as ArgPath).path);
    }
    return arg;
  });
}

function evaluate(singleNode: NamedNode, where: WherePath): boolean {
  if ((where as WhereEvaluationPath).path) {
    let shapeEndValue = resolveQueryPathEndResults(
      singleNode,
      (where as WhereEvaluationPath).path,
    );

    let args: any[] =
      (where as ProcessedWhereEvaluationPath).processedArgs ||
      preProcessWhere(where as WhereEvaluationPath);

    //when multiple values are the subject of the evaluation
    //and, we're NOT evaluating some() or every()
    if (
      (shapeEndValue instanceof NodeSet || Array.isArray(shapeEndValue)) &&
      (where as WhereEvaluationPath).method !== WhereMethods.SOME &&
      (where as WhereEvaluationPath).method !== WhereMethods.EVERY
    ) {
      //then by default we use some()
      //that means, if any of the results matches the where clause, then the subject shape is returned
      return shapeEndValue.some((singleEndValue) => {
        return evaluateWhere(
          singleEndValue as any,
          (where as WhereEvaluationPath).method,
          args,
        );
      });
    }
    return evaluateWhere(
      shapeEndValue as any,
      (where as WhereEvaluationPath).method,
      args,
    );
  } else if ((where as WhereAndOr).andOr) {
    //the first run we simply take the result as the combined result
    let initialResult: boolean = evaluate(
      singleNode,
      (where as WhereAndOr).firstPath,
    );

    //Next we process the AND clauses. To do this, we combine the results of any AND clause with the previous WherePath
    //For example p.friends.where(f => f.name.equals('Semmy')).and.where(f => f.age.equals(30))
    //Then the results of f.name.equals is the initial path, which gets combined with the results of f.age.equals

    //TODO: prepare this once, before resolveWhere is called. Currently we do this for every results moving through the where clause
    //first we make a new array that tracks the intermediate results.
    //so we resolve all the where paths and add them to an array
    type AndSet = {and: boolean};
    type OrSet = {or: boolean};
    let booleanPaths: (boolean | AndSet | OrSet)[] = [initialResult];
    (where as WhereAndOr).andOr.forEach((andOr) => {
      if (andOr.and) {
        //if there is an and, we add the result of that and to the array
        booleanPaths.push({and: evaluate(singleNode, andOr.and)});
      } else if (andOr.or) {
        //if there is an or, we add the result of that or to the array
        booleanPaths.push({or: evaluate(singleNode, andOr.or)});
      }
    });

    //Say that we have: booleanPaths = [boolean,{and:boolean},{or:boolean},{and:boolean}]
    //We should first process the AND: by combining the results of 0 & 1 and also 2 & 3
    //So that it becomes: booleanPaths = [boolean,{or:boolean}]

    var i = booleanPaths.length;
    while (i--) {
      let previous = booleanPaths[i - 1];
      let current = booleanPaths[i];

      if (typeof previous === 'undefined' || typeof current === 'undefined')
        break;
      //if the previous is a ShapeSet and the current is a ShapeSet, we combine them
      if ((current as AndSet).hasOwnProperty('and')) {
        if (previous.hasOwnProperty('and')) {
          (booleanPaths[i - 1] as AndSet).and =
            (previous as AndSet).and && (current as AndSet).and;
        } else if (previous.hasOwnProperty('or')) {
          (booleanPaths[i - 1] as OrSet).or =
            (previous as OrSet).or && (current as AndSet).and;
        } else if (typeof previous === 'boolean') {
          booleanPaths[i - 1] = previous && (current as AndSet).and;
        }
        booleanPaths.splice(i, 1);
      }
    }

    //next we process the OR clauses
    var i = booleanPaths.length;
    while (i--) {
      let previous = booleanPaths[i - 1];
      let current = booleanPaths[i];

      if (typeof previous === 'undefined' || typeof current === 'undefined')
        break;

      //for all or clauses, keep the results that are in either of the sets, so simply combine them
      if ((current as OrSet).hasOwnProperty('or')) {
        if (previous.hasOwnProperty('and')) {
          (booleanPaths[i - 1] as AndSet).and =
            (previous as AndSet).and || (current as OrSet).or;
        } else if (previous.hasOwnProperty('or')) {
          (booleanPaths[i - 1] as OrSet).or =
            (previous as OrSet).or || (current as OrSet).or;
        } else if (typeof previous === 'boolean') {
          booleanPaths[i - 1] = previous || (current as OrSet).or;
        }
        //remove the current item from the array now that its processed
        booleanPaths.splice(i, 1);
      }
    }
    if (booleanPaths.length > 1) {
      throw new Error(
        'booleanPaths should only have one item left: ' + booleanPaths.length,
      );
    }
    //there should only be a single boolean left
    return booleanPaths[0] as boolean;
  }
}

function resolveWhereEquals(queryEndValue, otherValue: any) {
  if (
    queryEndValue instanceof NamedNode &&
    (otherValue as NodeReferenceValue).id
  ) {
    return queryEndValue.uri === otherValue.id;
  }
  return queryEndValue === otherValue;
}

function resolveWhereSome(
  nodes: NodeSet<NamedNode>,
  evaluation: WhereEvaluationPath,
) {
  return nodes.some((node) => {
    return evaluate(node, evaluation);
  });
}

function resolveWhereEvery(nodes, evaluation: WhereEvaluationPath) {
  //there is an added check to see if there are any shapes
  // because for example for this query where(p => p.friends.every(f => f.name.equals('Semmy')))
  // it would be natural to expect that if there are no friends, the query would return false
  return (
    nodes.size > 0 &&
    nodes.every((node) => {
      return evaluate(node, evaluation);
    })
  );
}

function resolveQuerySteps(
  subject:
    | NamedNode[]
    | JSPrimitive
    | JSPrimitive[]
    | NamedNode
    | NodeSet<NamedNode>,
  queryPath: (QueryStep | SubQueryPaths)[],
  resultObjects?: NodeResultMap | QResult<any, any>,
) {
  if (queryPath.length === 0) {
    return subject;
  }
  //queryPath.slice(1,queryPath.length);
  let [currentStep, ...restPath] = queryPath;

  //if the first step is a ShapeReferenceValue, it comes from a QueryContextVariable
  //and it serves as a replacement for the subject
  if (
    (currentStep as ShapeReferenceValue).id &&
    (currentStep as ShapeReferenceValue).shape
  ) {
    // let shape = getShapeClass(NamedNode.getNamedNode((currentStep as ShapeReferenceValue).shape.id));
    // const shapeInstance = (shape as any).getFromURI((currentStep as ShapeReferenceValue).id) as Shape;
    // subject = shapeInstance;
    subject = NamedNode.getOrCreate((currentStep as ShapeReferenceValue).id);
    //continue with the next step for this new subject
    [currentStep, ...restPath] = restPath;
  }

  if (subject instanceof NamedNode) {
    if (Array.isArray(currentStep)) {
      return resolveQueryPathsForNode(
        queryPath as SubQueryPaths,
        subject,
        resultObjects,
      );
    }
    //TODO: review differences between shape vs shapes and make it DRY
    return resolveQueryStepForNode(
      currentStep,
      subject,
      restPath,
      resultObjects as QResult<any, any>,
    );
    // } else if (subject instanceof CoreMap) {
  } else if (subject instanceof NodeSet) {
    if (Array.isArray(currentStep)) {
      resolveQueryPathsForNodes(currentStep, subject, restPath, resultObjects);
    } else {
      resolveQueryStepForNodes(
        currentStep as QueryStep,
        subject,
        resultObjects,
        restPath,
      );
    }
    //return converted subjects
    return subject;
    //turn the map into an array of results
    // return [...resultObjects.values()];
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}

function shapeToResultObject(subject: NamedNode) {
  return {
    id: subject.uri,
    // shape: subject,
  };
}

function namedNodeToResultObject(subject: NamedNode) {
  return {
    id: subject.uri,
  };
}

function literalNodeToResultObject(literal: Literal, property: PropertyShape) {
  let datatype = property.datatype;
  let value = literal.value;
  if (datatype) {
    const dtId = (datatype as any).id ?? datatype;
    if (dtId === xsd.boolean.id) {
      return value === 'true';
    } else if (dtId === xsd.integer.id) {
      return parseInt(value);
    } else if (dtId === xsd.decimal.id || dtId === xsd.double.id) {
      return parseFloat(value);
    } else if (dtId === xsd.date.id || dtId === xsd.dateTime.id) {
      return new Date(value);
    }
  }
  //for other datatypes we just return the string value
  return value;
}

function nodesToResultObjects(subject: NodeSet<NamedNode>) {
  //create the start of the result JS object for each subject node
  let resultObjects: NodeResultMap = new CoreMap();
  subject.forEach((sub) => {
    resultObjects.set(sub.uri, shapeToResultObject(sub));
  });
  return resultObjects;
}

function resolveQueryStepEndResults(
  subject: NodeSet<NamedNode> | NamedNode[] | NamedNode,
  queryStep: QueryStep | SubQueryPaths,
) {
  // if (subject instanceof NamedNode) {
  //   if (Array.isArray(queryStep)) {
  //     return resolveQueryPathsForNodeEndResults(queryStep, subject);
  //   }
  //   //TODO: review differences between shape vs shapes and make it DRY
  //   return resolveQueryStepForNodeEndResults(queryStep, subject);
  // } else {
  //   throw new Error('Unknown subject type: ' + typeof subject);
  // }

  if (subject instanceof NamedNode) {
    if (Array.isArray(queryStep)) {
      return resolveQueryPathsForNodeEndResults(queryStep, subject);
    }
    //TODO: review differences between shape vs shapes and make it DRY
    return resolveQueryStepForNodeEndResults(queryStep, subject);
  }
  if (subject instanceof NodeSet) {
    if (Array.isArray(queryStep)) {
      return resolveQueryPathsForNodesEndResults(queryStep, subject);
    }
    return resolveQueryStepForNodesEndResults(queryStep as QueryStep, subject);
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}

function resolveQueryPathsForNodes(
  queryPaths: SubQueryPaths,
  subjects: NodeSet<NamedNode>,
  restPath: (QueryStep | SubQueryPaths)[],
  resultObjects: NodeResultMap,
) {
  let results = [];
  subjects.forEach((subject) => {
    let resultObject = resultObjects.get(subject.uri);
    let subjectResult = resolveQueryPathsForNode(
      queryPaths,
      subject,
      resultObject,
    );
    let subResult = resolveQuerySteps(
      subjectResult as any,
      restPath,
      resultObject,
    );
    results.push(subResult);
  });
  return results;
}

function resolveQueryPathsForNodesEndResults(
  queryPaths: SubQueryPaths,
  subjects: NodeSet<NamedNode>,
) {
  let results = [];
  subjects.forEach((subject) => {
    results.push(resolveQueryPathsForNodeEndResults(queryPaths, subject));
  });
  return results;
}

function resolveQueryPathsForNode(
  queryPaths: SubQueryPaths,
  subject: NamedNode,
  resultObject: QResult<any, any>,
) {
  if (Array.isArray(queryPaths)) {
    return queryPaths.map((queryPath) => {
      return resolveQueryPath(subject, queryPath, resultObject);
    });
  } else {
    throw new Error(
      'TODO: implement support for custom query object: ' + queryPaths,
    );
  }
}

function resolveQueryPathsForNodeEndResults(
  queryPaths: SubQueryPaths,
  subject: NamedNode,
) {
  if (Array.isArray(queryPaths)) {
    return queryPaths.map((queryPath) => {
      return resolveQueryPathEndResults(subject, queryPath);
    });
  } else {
    throw new Error(
      'TODO: implement support for custom query object: ' + queryPaths,
    );
  }
}

function resolveQueryStepForNode(
  queryStep: QueryStep | SubQueryPaths,
  subject: NamedNode,
  restPath: (QueryStep | SubQueryPaths)[],
  resultObject: QResult<any, any>,
) {
  if ((queryStep as PropertyQueryStep).property) {
    return resolvePropertyStep(
      subject,
      queryStep as PropertyQueryStep,
      restPath,
      resultObject,
    );
  } else if ((queryStep as SizeStep).count) {
    return resolveCountStep(subject, queryStep as SizeStep, resultObject);
  } else if ((queryStep as PropertyQueryStep).where) {
    throw new Error('Cannot filter a single shape');
    // } else if ((queryStep as BoundComponentQueryStep).component) {
    //   return (queryStep as BoundComponentQueryStep).component.create(subject);
  } else if (typeof queryStep === 'object') {
    return resolveCustomObject(
      subject,
      queryStep as CustomQueryObject,
      resultObject,
    );
  } else {
    throw Error('Invalid query step: ' + queryStep);
  }
}

function resolveQueryStepForNodeEndResults(
  queryStep: QueryStep | SubQueryPaths,
  subject: NamedNode,
) {
  if ((queryStep as PropertyQueryStep).property) {
    let result = resolveQueryPropertyPath(
      subject,
      (queryStep as PropertyQueryStep).property,
    );
    if ((queryStep as PropertyQueryStep).where) {
      result = filterResults(result, (queryStep as PropertyQueryStep).where);
    }
    return result;
  } else if ((queryStep as SizeStep).count) {
    return resolveCountStep(subject, queryStep as SizeStep);
  } else if ((queryStep as PropertyQueryStep).where) {
    //in some cases there is a query step without property but WITH where
    //this happens when the where clause is on the root of the query
    //like Person.select(p => p.where(...))
    //in that case the where clause is directly applied to the given subject
    debugger;
    // let whereResult = resolveWhere(subject as ShapeSet, queryStep.where);
    // return whereResult;
    // } else if ((queryStep as BoundComponentQueryStep).component) {
    //   return (queryStep as BoundComponentQueryStep).component.create(subject);
    //   debugger;
  } else {
    throw Error('Invalid query step: ' + queryStep.toString());
  }
}

function stepResultToSubResult(stepResult, property: PropertyShape) {
  //TODO: review if this ever happens once we move away from relying on accessor implementation, review where this method is used
  // and if this code ever triggers
  if (stepResult instanceof NodeSet) {
    return nodesToResultObjects(stepResult);
  }
  // else if (stepResult instanceof Shape) {
  //   return shapeToResultObject(stepResult);
  // }
  //temporary support for accessors returning named nodes
  else if (stepResult instanceof NamedNode) {
    return namedNodeToResultObject(stepResult);
  } else if (stepResult instanceof Literal) {
    return literalNodeToResultObject(stepResult, property);
  } else if (Array.isArray(stepResult)) {
    return stepResult.map((r) => stepResultToSubResult(r, property));
  } else {
    //strings,numbers,booleans,dates can just pass. but not other objects
    if (stepResult && typeof stepResult === 'object') {
      if (!(stepResult instanceof Date)) {
        console.warn(
          'New warning, is this a warning? Unknown step result type: ',
          stepResult,
        );
      }
    }
    return stepResult;
  }
}

export function resolveQueryPropertyPath(
  node: NamedNode,
  property: PropertyShape,
) {
  const singleValueProperty = property.maxCount === 1;
  let pathResult;
  let rawPath = property.path;
  let pathNodes: NamedNode[] = Array.isArray(rawPath)
    ? rawPath.map(p => toNamedNode(p))
    : [toNamedNode(rawPath)];
  let lastProp = pathNodes.pop();
  let target: any = node;
  while (pathNodes.length > 0) {
    let prop = pathNodes.pop();
    target = target.getAll(prop);
  }

  if (singleValueProperty) {
    pathResult = convertLiteralToPrimitive(target.getOne(lastProp), property);
  } else {
    pathResult = target.getAll(lastProp);
    //if every value is a literal, we convert it to a plain array of plain/primitive values
    //if not, we keep using NodeSet, so we can more easily access sub paths from this potentially intermediate result.
    if (pathResult.every((n) => n instanceof Literal) && pathResult.size > 0) {
      pathResult = pathResult.map((v) =>
        convertLiteralToPrimitive(v, property),
      );
    }
  }
  return pathResult;
}

function convertLiteralToPrimitive(node: Node, property: PropertyShape) {
  if (node instanceof Literal) {
    return literalNodeToResultObject(node, property);
  }
  return node;
}

function resolvePropertyStep(
  singleNode: NamedNode,
  queryStep: PropertyQueryStep,
  restPath: (QueryStep | SubQueryPaths)[],
  resultObjects: NodeResultMap | QResult<any, any>,
) {
  //sometimes when .as() was used we may get a singleShape as subject that does not match with the nodeShape of the property of this step
  //If the singleShape does not match the nodeShape of the property, we change the shape
  // if(!singleNode.equals(queryStep.property.parentNodeShape.namedNode)) {
  //   singleNode = new (getShapeClass(queryStep.property.parentNodeShape.namedNode) as any)(singleNode);
  // }
  //access the result on a node level
  let stepResult = resolveQueryPropertyPath(singleNode, queryStep.property);

  //directly access the get/set method of the shape
  // let stepResult = singleShape[(queryStep as PropertyQueryStep).property.label];
  let subResultObjects = stepResultToSubResult(stepResult, queryStep.property);

  if ((queryStep as PropertyQueryStep).where) {
    stepResult = filterResults(
      stepResult,
      (queryStep as PropertyQueryStep).where,
      subResultObjects,
    );
    //if the result is empty, then the shape didn't make it through the filter and needs to be removed from the results
    // if (typeof stepResult === 'undefined' || stepResult === null) {
    //   resultObjects.delete(singleShape.uri);
    //   return;
    // }
    //if the filtered result is null or undefined, then we don't need to add it to the result object
    if (typeof stepResult === 'undefined' || stepResult === null) {
      return;
    }
  }

  if (restPath.length > 0 && typeof stepResult !== 'undefined') {
    //if there is more properties left, continue to fill the result object by resolving the next steps
    stepResult = resolveQuerySteps(stepResult, restPath, subResultObjects);
  }

  //TODO: refactor/review this code - although it works and its inticrate, its moved around
  // just change names so its more clear
  //This converts the subResultObjects into the step result, but are there always "subResultObjects"?
  //Moved this outside the if because customObject results also need this (so we return an array of result objects, not a nodeset)
  stepResult =
    subResultObjects instanceof Map
      ? [...subResultObjects.values()]
      : subResultObjects;

  if (typeof resultObjects !== 'undefined') {
    // }
    // if (stepResult instanceof ShapeSet) {
    //   stepResult = [...subResultObjects.values()];
    // }
    // if (stepResult instanceof Shape) {
    //   stepResult = subResultObjects;
    // }

    //get the current result object for this shape
    // if (typeof resultObjects !== 'undefined') {
    let nodeResult =
      resultObjects instanceof Map
        ? resultObjects.get(singleNode.uri)
        : resultObjects;
    //write the result for this property into the result object
    writeResultObject(nodeResult, queryStep.property.label, stepResult);
    // nodeResult[(queryStep as PropertyQueryStep).property.label] = stepResult;
    return subResultObjects ? nodeResult : stepResult;
  }
  // nodeResult[(queryStep as PropertyQueryStep).property.label] = subResultObjects
  //   ? subResultObjects instanceof Map
  //     ? [...subResultObjects.values()]
  //     : subResultObjects
  //   : stepResult;
  // return stepResult;
  return stepResult;
  // resultObjects
  //   ? resultObjects instanceof Map
  //     ? [...resultObjects.values()]
  //     : resultObjects
  //   : stepResult;
}

function resolveCountStep(
  singleNode: NamedNode,
  queryStep: SizeStep,
  resultObjects?: NodeResultMap,
) {
  //We use the flat version of resolveQuerySteps here, because  we don't need QResult objects here
  // we're only interested in the final results
  let countable = resolveQueryPathEndResults(
    singleNode,
    (queryStep as SizeStep).count,
  );
  let result: number;
  if (Array.isArray(countable)) {
    result = countable.length;
  } else if (countable instanceof Set) {
    result = countable.size;
  } else {
    throw Error('Not sure how to count this: ' + countable.toString());
  }
  updateResultObjects(singleNode, queryStep, result, resultObjects, 'count');
  return result;
}

function updateResultObjects(
  node: NamedNode,
  queryStep: QueryStep,
  result: any,
  resultObjects: NodeResultMap,
  defaultLabel?: string,
) {
  if (resultObjects) {
    let nodeResult =
      resultObjects instanceof Map
        ? resultObjects.get(node.uri)
        : resultObjects;
    if (nodeResult) {
      writeResultObject(
        nodeResult,
        (queryStep as SizeStep).label || defaultLabel,
        result,
      );
    }
  }
}

function resolveQueryStepForNodes(
  queryStep: QueryStep,
  subject: NodeSet<NamedNode>,
  resultObjects: NodeResultMap,
  restPath: (QueryStep | SubQueryPaths)[],
) {
  if ((queryStep as PropertyQueryStep).property) {
    subject.forEach((singleNode) => {
      resolvePropertyStep(
        singleNode,
        queryStep as PropertyQueryStep,
        restPath,
        resultObjects,
      );
    });
    // return result;
  } else if ((queryStep as SizeStep).count) {
    //count the countable
    subject.forEach((singleNode) => {
      resolveCountStep(singleNode, queryStep as SizeStep, resultObjects);
    });
  } else if ((queryStep as PropertyQueryStep).where) {
    //in some cases there is a query step without property but WITH where
    //this happens when the where clause is on the root of the query
    //like Person.select(p => p.where(...))
    //in that case the where clause is directly applied to the given subject
    subject = filterResults(
      subject,
      (queryStep as PropertyQueryStep).where,
      resultObjects,
    ) as any;

    if (restPath.length > 0) {
      //if there is more properties left, continue to fill the result object by resolving the next steps
      resolveQuerySteps(subject, restPath, resultObjects);
    }
    // return whereResult;
  } else if (typeof queryStep === 'object') {
    subject.forEach((singleShape) => {
      resolveCustomObject(
        singleShape,
        queryStep as CustomQueryObject,
        resultObjects ? resultObjects.get(singleShape.uri) : null,
      );
    });
  }
}

function resolveQueryStepForNodesEndResults(
  queryStep: QueryStep,
  subject: NodeSet<NamedNode>,
) {
  if ((queryStep as PropertyQueryStep).property) {
    //if the propertyshape states that it only accepts literal values in the graph,
    // then the result will be an Array
    let result =
      (queryStep as PropertyQueryStep).property.nodeKind?.id === shacl.Literal.id ||
      (queryStep as SizeStep).count
        ? []
        : new NodeSet();

    (subject as NodeSet<NamedNode>).forEach((singleNode) => {
      // //directly access the get/set method of the shape
      // let stepResult =
      //   singleNode[(queryStep as PropertyQueryStep).property.label];
      // let stepResult:NodeSet<NamedNode>|NamedNode[]|NamedNode|number = getPropertyPath(singleNode,(queryStep as PropertyQueryStep).property.path);
      let stepResult = resolveQueryPropertyPath(
        singleNode,
        (queryStep as PropertyQueryStep).property,
      );

      if ((queryStep as PropertyQueryStep).where) {
        stepResult = filterResults(
          stepResult,
          (queryStep as PropertyQueryStep).where,
        );
      }
      if ((queryStep as SizeStep).count) {
        if (Array.isArray(stepResult)) {
          stepResult = stepResult.length;
        } else if (stepResult instanceof Set) {
          stepResult = stepResult.size;
        } else {
          throw Error('Not sure how to count this: ' + stepResult.toString());
        }
      }

      if (typeof stepResult === 'undefined' || stepResult === null) {
        return;
      }

      if (stepResult instanceof NodeSet) {
        stepResult = [...stepResult] as NamedNode[];
      }

      if (Array.isArray(stepResult)) {
        result = result.concat(stepResult as NamedNode[]);
      } else if (stepResult instanceof NamedNode) {
        (result as NodeSet).add(stepResult);
      } else if (primitiveTypes.includes(typeof stepResult)) {
        (result as any[]).push(stepResult);
      } else {
        throw Error(
          'Unknown result type: ' +
            typeof stepResult +
            ' for property ' +
            (queryStep as PropertyQueryStep).property.label +
            ' on shape ' +
            singleNode.toString() +
            ')',
        );
      }
    });
    return result;
  } else if ((queryStep as PropertyQueryStep).where) {
    //in some cases there is a query step without property but WITH where
    //this happens when the where clause is on the root of the query
    //like Person.select(p => p.where(...))
    //in that case the where clause is directly applied to the given subject
    let whereResult = filterResults(
      subject,
      (queryStep as PropertyQueryStep).where,
    );
    return whereResult;
  }
}

function XSDDate_fromNativeDate(nativeDate: Date, datatype: {id: string}) {
  if (!nativeDate) return null;

  var value = nativeDate.toISOString();
  let literal = new Literal(value, toNamedNode(datatype));
  return literal;
}

function Boolean_toLiteral(value: boolean) {
  return new Literal(value.toString(), toNamedNode(xsd.boolean));
}
