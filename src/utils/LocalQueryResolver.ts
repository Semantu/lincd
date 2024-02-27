import {
  ComponentQueryPath,
  CountStep,
  CustomQueryObject,
  Evaluation,
  GetQueryResponseType,
  JSPrimitive,
  LinkedQuery,
  LinkedQueryObject,
  NodeResultMap,
  PropertyQueryStep,
  QResult,
  QueryPath,
  QueryPrimitiveSet,
  QueryStep,
  QueryBuilderObject,
  SubQueryPaths,
  QueryResponseToEndValues,
  WhereAndOr,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
  SelectQuery,
} from './LinkedQuery';
import {ShapeSet} from '../collections/ShapeSet';
import {Shape} from '../shapes/Shape';
import {shacl} from '../ontologies/shacl';
import {CoreMap} from '../collections/CoreMap';
import {ShapeValuesSet} from '../collections/ShapeValuesSet';
import {result} from 'lincd-shacl/lib/ontologies/shacl';

const primitiveTypes: string[] = ['string', 'number', 'boolean', 'Date'];

/**
 * Resolves the query locally, by searching the graph in local memory, without using stores.
 * Returns the result immediately.
 * The results will be the end point reached by the query
 */
export function resolveLocal<ResultType>(
  query: SelectQuery<any>,
  shape: typeof Shape,
): ResultType {
  let subject = query.subject
    ? query.subject
    : (shape as any).getLocalInstances();

  if (query.limit && subject instanceof ShapeSet) {
    subject = subject.slice(
      query.offset || 0,
      (query.offset || 0) + query.limit,
    );
  }

  let resultObjects =
    query.subject instanceof ShapeSet
      ? shapeSetToResultObjects(subject)
      : query.subject instanceof Shape
      ? shapeToResultObject(subject)
      : shapeSetToResultObjects(subject);

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
    query.subject ? r(subject) : subject.map(r);
  }
  return (
    resultObjects instanceof Map ? [...resultObjects.values()] : resultObjects
  ) as ResultType;
}

/**
 * resolves each key of the custom query object
 * and writes the result to the resultObject with the same keys
 * @param subject
 * @param query
 * @param resultObject
 */
function resolveCustomObject(
  subject: Shape,
  query: CustomQueryObject,
  resultObject: QResult<any, any>,
) {
  // let customResult = shapeToResultObject(subject);
  for (let key of Object.getOwnPropertyNames(query as CustomQueryObject)) {
    //wrong... we need to write the result to the resultObject
    //can we find which key was written and take that and use the key?
    let result = resolveQueryPath(subject, query[key]);
    resultObject[key] = result;
  }
  return resultObject;
}
export function resolveLocalEndResults<S extends LinkedQuery<any>>(
  query: S,
  subject?: ShapeSet | Shape,
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
    query.traceResponse instanceof LinkedQuery
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
    return results.length > 0 ? [...results[0]] : ([] as any);
  } else if (typeof query.traceResponse === 'object') {
    throw new Error('Objects are not yet supported');
  }
}

function resolveQueryPath(
  subject: ShapeSet | Shape,
  queryPath: QueryPath | ComponentQueryPath,
  resultObjects?: NodeResultMap | QResult<any, any>,
) {
  //start with the local instance as the subject
  if (Array.isArray(queryPath)) {
    //if the queryPath is an array of query steps, then resolve the query steps and let that convert the result
    return resolveQuerySteps(subject, queryPath as any[], resultObjects);
  } else {
    if (subject instanceof Shape) {
      return evaluate(subject, queryPath as WherePath);
    }
    return (subject as ShapeSet).map((singleShape) => {
      return evaluate(singleShape, queryPath as WherePath);
    });
  }
}

function resolveQueryPathEndResults(
  subject: ShapeSet | Shape,
  queryPath: QueryPath | ComponentQueryPath,
) {
  //start with the local instance as the subject
  let result: ShapeSet | Shape[] | Shape | boolean[] = subject;
  if (Array.isArray(queryPath)) {
    queryPath.forEach((queryStep) => {
      //then resolve each of the query steps and use the result as the new subject for the next step
      result = resolveQueryStepEndResults(
        result as ShapeSet | Shape,
        queryStep,
      );
    });
  } else {
    result = (subject as ShapeSet).map((singleShape) => {
      return evaluate(singleShape, queryPath as WherePath);
    });
  }
  //return the final value at the end of the path
  return result as ShapeSet | Shape[] | Shape | JSPrimitive | JSPrimitive[];
}

function evaluateWhere(shape: Shape, method: string, args: any[]): boolean {
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
  return filterMethod.apply(null, [shape, ...args]);
}

/**
 * Filters down the given subjects to only those what match the where clause
 * @param subject
 * @param where
 * @private
 */
function filterResults(
  subject: ShapeSet | Shape,
  where: WherePath,
  resultObjects?: NodeResultMap,
): ShapeSet | Shape {
  // if ((where as WhereEvaluationPath).path) {
  //for nested where clauses the subject will already be a QueryValue
  //TODO: check if subject is ever not a shape, shapeset or string

  //we're about to remove values from the subject set, so we need to clone it first so that we don't alter the graph
  if (subject instanceof ShapeValuesSet) {
    subject = subject.clone() as ShapeSet;
  }
  if (subject instanceof ShapeSet) {
    subject.forEach((singleShape) => {
      if (!evaluate(singleShape, where as WhereEvaluationPath)) {
        resultObjects.delete(singleShape.uri);
        (subject as ShapeSet).delete(singleShape);
      }
    });
    return subject;
  } else if (subject instanceof Shape) {
    return evaluate(subject, where as WhereEvaluationPath)
      ? subject
      : undefined;
  } else if (typeof subject === 'string') {
    return evaluate(subject, where as WhereEvaluationPath)
      ? subject
      : undefined;
  } else {
    throw Error('Unknown subject type: ' + subject);
  }
}

function evaluate(singleShape: Shape, where: WherePath): boolean {
  if ((where as WhereEvaluationPath).path) {
    let shapeEndValue = resolveQueryPathEndResults(
      singleShape,
      (where as WhereEvaluationPath).path,
    );
    //when multiple values are the subject of the evaluation
    //and, we're NOT evaluating some() or every()
    if (
      (shapeEndValue instanceof ShapeSet || Array.isArray(shapeEndValue)) &&
      (where as WhereEvaluationPath).method !== WhereMethods.SOME &&
      (where as WhereEvaluationPath).method !== WhereMethods.EVERY
    ) {
      //then by default we use some()
      //that means, if any of the results matches the where clause, then the subject shape is returned
      return shapeEndValue.some((singleEndValue) => {
        return evaluateWhere(
          singleEndValue as any,
          (where as WhereEvaluationPath).method,
          (where as WhereEvaluationPath).args,
        );
      });
    }
    return evaluateWhere(
      shapeEndValue as any,
      (where as WhereEvaluationPath).method,
      (where as WhereEvaluationPath).args,
    );
  } else if ((where as WhereAndOr).andOr) {
    //the first run we simply take the result as the combined result
    let initialResult: boolean = evaluate(
      singleShape,
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
        booleanPaths.push({and: evaluate(singleShape, andOr.and)});
      } else if (andOr.or) {
        //if there is an or, we add the result of that or to the array
        booleanPaths.push({or: evaluate(singleShape, andOr.or)});
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

function resolveWhereEquals(queryEndValue, otherValue: string) {
  return queryEndValue === otherValue;
}

function resolveWhereSome(
  shapes: ShapeSet<any>,
  evaluation: WhereEvaluationPath,
) {
  return shapes.some((singleShape) => {
    return evaluate(singleShape, evaluation);
  });
}

function resolveWhereEvery(shapes, evaluation: WhereEvaluationPath) {
  //there is an added check to see if there are any shapes
  // because for example for this query where(p => p.friends.every(f => f.name.equals('Semmy')))
  // it would be natural to expect that if there are no friends, the query would return false
  return (
    shapes.size > 0 &&
    shapes.every((singleShape) => {
      return evaluate(singleShape, evaluation);
    })
  );
}

function resolveQuerySteps(
  subject: ShapeSet | Shape[] | Shape | JSPrimitive | JSPrimitive[],
  queryPath: (QueryStep | SubQueryPaths)[],
  resultObjects?: NodeResultMap | QResult<any, any>,
) {
  if (queryPath.length === 0) {
    return subject;
  }
  //queryPath.slice(1,queryPath.length);
  let [currentStep, ...restPath] = queryPath;

  if (subject instanceof Shape) {
    if (Array.isArray(currentStep)) {
      return resolveQueryPathsForShape(
        queryPath as SubQueryPaths,
        subject,
        resultObjects,
      );
    }
    //TODO: review differences between shape vs shapes and make it DRY
    return resolveQueryStepForShape(
      currentStep,
      subject,
      restPath,
      resultObjects as QResult<any, any>,
    );
    // } else if (subject instanceof CoreMap) {
  } else if (subject instanceof ShapeSet) {
    // let resultObjects = shapeSetToResultObjects(subject);

    if (Array.isArray(currentStep)) {
      // debugger;
      resolveQueryPathsForShapes(currentStep, subject, restPath, resultObjects);
    } else {
      resolveQueryStepForShapes(
        currentStep as QueryStep,
        subject as ShapeSet,
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
function shapeToResultObject(subject: Shape) {
  return {
    id: subject.uri,
    shape: subject,
  };
}
function shapeSetToResultObjects(subject: ShapeSet) {
  //create the start of the result JS object for each subject node
  let resultObjects: NodeResultMap = new CoreMap();
  subject.forEach((sub) => {
    resultObjects.set(sub.uri, shapeToResultObject(sub));
  });
  return resultObjects;
}

function resolveQueryStepEndResults(
  subject: ShapeSet | Shape[] | Shape,
  queryStep: QueryStep | SubQueryPaths,
) {
  if (subject instanceof Shape) {
    if (Array.isArray(queryStep)) {
      return resolveQueryPathsForShapeEndResults(queryStep, subject);
    }
    //TODO: review differences between shape vs shapes and make it DRY
    return resolveQueryStepForShapeEndResults(queryStep, subject);
  }
  if (subject instanceof ShapeSet) {
    if (Array.isArray(queryStep)) {
      return resolveQueryPathsForShapesEndResults(queryStep, subject);
    }
    return resolveQueryStepForShapesEndResults(queryStep as QueryStep, subject);
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}

function resolveQueryPathsForShapes(
  queryPaths: SubQueryPaths,
  subjects: ShapeSet,
  restPath: (QueryStep | SubQueryPaths)[],
  resultObjects: NodeResultMap,
) {
  let results = [];
  subjects.forEach((subject) => {
    let resultObject = resultObjects.get(subject.uri);
    let subjectResult = resolveQueryPathsForShape(
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

function resolveQueryPathsForShapesEndResults(
  queryPaths: SubQueryPaths,
  subjects: ShapeSet,
) {
  let results = [];
  subjects.forEach((subject) => {
    results.push(resolveQueryPathsForShapeEndResults(queryPaths, subject));
  });
  return results;
}

function resolveQueryPathsForShape(
  queryPaths: SubQueryPaths,
  subject: Shape,
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

function resolveQueryPathsForShapeEndResults(
  queryPaths: SubQueryPaths,
  subject: Shape,
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
function resolveQueryStepForShape(
  queryStep: QueryStep | SubQueryPaths,
  subject: Shape,
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
  } else if ((queryStep as CountStep).count) {
    return resolveCountStep(subject, queryStep as CountStep, resultObject);
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
    throw Error('Unknown query step: ' + queryStep);
  }
}

function resolveQueryStepForShapeEndResults(
  queryStep: QueryStep | SubQueryPaths,
  subject: Shape,
) {
  if ((queryStep as PropertyQueryStep).property) {
    let result = subject[(queryStep as PropertyQueryStep).property.label];
    if ((queryStep as PropertyQueryStep).where) {
      result = filterResults(result, (queryStep as PropertyQueryStep).where);
    }
    return result;
  } else if ((queryStep as CountStep).count) {
    return resolveCountStep(subject, queryStep as CountStep);
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
    throw Error('Unknown query step: ' + queryStep.toString());
  }
}

function resolvePropertyStep(
  singleShape: Shape,
  queryStep: PropertyQueryStep,
  restPath: (QueryStep | SubQueryPaths)[],
  resultObjects: NodeResultMap | QResult<any, any>,
) {
  //directly access the get/set method of the shape
  let stepResult = singleShape[(queryStep as PropertyQueryStep).property.label];
  let subResultObjects;
  if (stepResult instanceof ShapeSet) {
    subResultObjects = shapeSetToResultObjects(stepResult);
  }
  if (stepResult instanceof Shape) {
    subResultObjects = shapeToResultObject(stepResult);
  }

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

  if (restPath.length > 0) {
    //if there is more properties left, continue to fill the result object by resolving the next steps
    stepResult = resolveQuerySteps(stepResult, restPath, subResultObjects);
  }
  if (subResultObjects) {
    stepResult =
      subResultObjects instanceof Map
        ? [...subResultObjects.values()]
        : subResultObjects;
  }
  // if (stepResult instanceof ShapeSet) {
  //   stepResult = [...subResultObjects.values()];
  // }
  // if (stepResult instanceof Shape) {
  //   stepResult = subResultObjects;
  // }

  //get the current result object for this shape
  if (resultObjects) {
    let nodeResult =
      resultObjects instanceof Map
        ? resultObjects.get(singleShape.uri)
        : resultObjects;
    //write the result for this property into the result object
    nodeResult[(queryStep as PropertyQueryStep).property.label] = stepResult;
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
  singleShape: Shape,
  queryStep: CountStep,
  resultObjects?: NodeResultMap,
) {
  //We use the flat version of resolveQuerySteps here, because  we don't need QResult objects here
  // we're only interested in the final results
  let countable = resolveQueryPathEndResults(
    singleShape,
    (queryStep as CountStep).count,
  );
  let result: number;
  if (Array.isArray(countable)) {
    result = countable.length;
  } else if (countable instanceof Set) {
    result = countable.size;
  } else {
    throw Error('Not sure how to count this: ' + countable.toString());
  }
  updateResultObjects(singleShape, queryStep, result, resultObjects, 'count');
  return result;
}
function updateResultObjects(
  singleShape: Shape,
  queryStep: QueryStep,
  result: any,
  resultObjects: NodeResultMap,
  defaultLabel?: string,
) {
  if (resultObjects) {
    let nodeResult =
      resultObjects instanceof Map
        ? resultObjects.get(singleShape.uri)
        : resultObjects;
    if (nodeResult) {
      nodeResult[(queryStep as CountStep).label || defaultLabel] = result;
    }
  }
}
function resolveQueryStepForShapes(
  queryStep: QueryStep,
  subject: ShapeSet,
  resultObjects: NodeResultMap,
  restPath: (QueryStep | SubQueryPaths)[],
) {
  if ((queryStep as PropertyQueryStep).property) {
    (subject as ShapeSet).forEach((singleShape) => {
      resolvePropertyStep(
        singleShape,
        queryStep as PropertyQueryStep,
        restPath,
        resultObjects,
      );
    });
    // return result;
  } else if ((queryStep as CountStep).count) {
    //count the countable
    (subject as ShapeSet).forEach((singleShape) => {
      resolveCountStep(singleShape, queryStep as CountStep, resultObjects);
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

function resolveQueryStepForShapesEndResults(
  queryStep: QueryStep,
  subject: ShapeSet,
) {
  if ((queryStep as PropertyQueryStep).property) {
    //if the propertyshape states that it only accepts literal values in the graph,
    // then the result will be an Array
    let result =
      (queryStep as PropertyQueryStep).property.nodeKind === shacl.Literal ||
      (queryStep as CountStep).count
        ? []
        : new ShapeSet();

    (subject as ShapeSet).forEach((singleShape) => {
      //directly access the get/set method of the shape
      let stepResult =
        singleShape[(queryStep as PropertyQueryStep).property.label];
      if ((queryStep as PropertyQueryStep).where) {
        stepResult = filterResults(
          stepResult,
          (queryStep as PropertyQueryStep).where,
        );
      }
      if ((queryStep as CountStep).count) {
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

      if (stepResult instanceof ShapeSet) {
        stepResult = [...stepResult];
      }

      if (stepResult instanceof ShapeSet) {
        result = result.concat(stepResult);
      } else if (Array.isArray(stepResult)) {
        result = result.concat(stepResult);
      } else if (stepResult instanceof Shape) {
        (result as ShapeSet).add(stepResult);
      } else if (primitiveTypes.includes(typeof stepResult)) {
        (result as any[]).push(stepResult);
      } else {
        throw Error(
          'Unknown result type: ' +
            typeof stepResult +
            ' for property ' +
            (queryStep as PropertyQueryStep).property.label +
            ' on shape ' +
            singleShape.toString() +
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
