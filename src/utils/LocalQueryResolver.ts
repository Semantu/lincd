import {
  LinkedQuery,
  LinkedWhereQuery,
  OriginalValue,
  QueryPath,
  QueryPrimitive,
  QueryPrimitiveSet,
  QueryShape,
  QueryShapeSet,
  QueryValueSetOfSets,
  QueryStep,
  QueryValue,
  ToNormalValue,
  WhereAnd,
  WhereAndOr,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
  JSPrimitive,
} from './LinkedQuery';
import {ShapeSet} from '../collections/ShapeSet';
import {Shape} from '../shapes/Shape';
import {shacl} from '../ontologies/shacl';

const primitiveTypes: string[] = ['string', 'number', 'boolean', 'Date'];

type GetQueryResponseType<Q> = Q extends LinkedQuery<any, infer ResponseType>
  ? ResponseType
  : never;

/**
 * Resolves the query locally, by searching the graph in local memory, without using stores.
 * Returns the result immediately.
 * The results will be the end point reached by the query
 */
export function resolveLocal<S extends LinkedQuery<any>>(
  query: S,
): ToNormalValue<GetQueryResponseType<S>> {
  let queryPaths = query.getQueryPaths();
  let localInstances = (query.shape as any).getLocalInstances();
  let results = [];

  queryPaths.forEach((queryPath) => {
    results.push(resolveQueryPath(localInstances, queryPath));
  });

  // convert the result of each instance into the shape that was requested
  if (query.traceResponse instanceof QueryValue) {
    //even though resolveQueryPaths always returns an array, if a single value was requested
    //we will return the first value of that array to match the request
    return results.shift();
    //map((result) => {
    //return result.shift();
    //});
  } else if (Array.isArray(query.traceResponse)) {
    //nothing to convert if an array was requested
    return results as any;
  } else if (query.traceResponse instanceof QueryValueSetOfSets) {
    return results.shift();
  } else if (query.traceResponse instanceof QueryPrimitiveSet) {
    //TODO: see how traceResponse is made for QueryValue. Here we need to return an array of the first item in the results?
    //does that also work if there is multiple values?
    //do we need to check the size of the traceresponse
    //why is a CoreSet created? start there
    return [...results[0]] as any;
  } else if (typeof query.traceResponse === 'object') {
    throw new Error('Objects are not yet supported');
  }
}

// return this.getOriginalSource(endValue);
function resolveWherePath(
  subject: QueryValue | QueryValueSetOfSets,
  queryPath: QueryPath,
) {
  //TODO: check overlap with resolveQueryPath, maybe this one can be removed?
  //start with the subject as the current "end result"
  let result: QueryValue | QueryValueSetOfSets | QueryPrimitiveSet = subject;
  queryPath.forEach((queryStep) => {
    //then resolve each of the query steps and use the result as the new subject for the next step
    result = resolveWhereStep(result, queryStep);
  });
  //return the final value at the end of the path
  return result;
}
function resolveQueryPath(subject: ShapeSet | Shape, queryPath: QueryPath) {
  //start with the local instance as the subject
  let result: ShapeSet | Shape[] | Shape = subject;
  queryPath.forEach((queryStep) => {
    //then resolve each of the query steps and use the result as the new subject for the next step
    result = resolveQueryStep(result, queryStep);
  });
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
function resolveWhere(
  subject: ShapeSet | Shape,
  where: WherePath,
): ShapeSet | Shape {
  // if ((where as WhereEvaluationPath).path) {
  //for nested where clauses the subject will already be a QueryValue
  //TODO: check if subject is ever not a shape, shapeset or string
  if (subject instanceof ShapeSet) {
    return subject.filter((singleShape) => {
      return evaluate(singleShape, where as WhereEvaluationPath);
    });
  } else if (subject instanceof Shape) {
    return evaluate(subject, where as WhereEvaluationPath) ? subject : null;
  } else if (typeof subject === 'string') {
    return evaluate(subject, where as WhereEvaluationPath) ? subject : null;
  } else {
    throw Error('Unknown subject type: ' + subject);
  }
  //
  // let convertedSubjects =
  //   subject instanceof Shape ||
  //   subject instanceof ShapeSet ||
  //   typeof subject === 'string'
  //     ? QueryValue.convertOriginal(subject, null, null)
  //     : subject;
  // let queryEndValues = resolveWherePath(
  //   convertedSubjects,
  //   (where as WhereEvaluationPath).path,
  // );
  //
  // let filterMethod: Function;
  // if ((where as WhereEvaluationPath).method === WhereMethods.EQUALS) {
  //   filterMethod = resolveWhereEquals;
  // } else if ((where as WhereEvaluationPath).method === WhereMethods.SOME) {
  //   filterMethod = resolveWhereSome;
  // } else if ((where as WhereEvaluationPath).method === WhereMethods.EVERY) {
  //   filterMethod = resolveWhereEvery;
  // } else {
  //   throw new Error(
  //     'Unimplemented where method: ' + (where as WhereEvaluationPath).method,
  //   );
  // }
  //
  // if (
  //   queryEndValues instanceof QueryPrimitiveSet ||
  //   queryEndValues instanceof QueryShapeSet
  // ) {
  //   queryEndValues = filterMethod.apply(null, [
  //     queryEndValues,
  //     ...(where as WhereEvaluationPath).args,
  //   ]);
  // } else if (queryEndValues instanceof QueryValueSetOfSets) {
  //   queryEndValues = new QueryValueSetOfSets(
  //     queryEndValues.map((queryEndValue) =>
  //       filterMethod.apply(null, [
  //         queryEndValue,
  //         ...(where as WhereEvaluationPath).args,
  //       ]),
  //     ),
  //   );
  // } else if (queryEndValues instanceof QueryValue) {
  //   queryEndValues = filterMethod
  //     .apply(null, [[queryEndValues], ...(where as WhereEvaluationPath).args])
  //     .shift();
  // } else {
  //   throw new Error(
  //     'Unimplemented type of subject: ' + (queryEndValues as any).toString(),
  //   );
  // }
  // //once the filtering of the where clause is done, we need to convert the result back to the original shape
  // //for example Person.select(p => p.friends.where(f => f.name.equals('Semmy')))
  // //the result of the where clause is an array of names (strings),
  // //but we need to return the filtered result of p.friends (which is a ShapeSet of Persons)
  // //TODO: check types
  // return QueryValue.getOriginalSource(
  //   queryEndValues as QueryValueSetOfSets,
  // ) as ShapeSet;
  // // return null;
  // // }
  // } else if ((where as WhereAndOr).andOr) {

  // }
}

function evaluate(singleShape: Shape, where: WherePath): boolean {
  if ((where as WhereEvaluationPath).path) {
    let shapeEndValue = resolveQueryPath(
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
  // return queryEndValues.filter((queryEndValue: QueryValue) => {
  return queryEndValue === otherValue;
  // });
}
function resolveSubWhere(queryEndValues, evaluation: WhereEvaluationPath) {
  //because the intermediate end results of the where clause are the subjects of the some clause
  //we need to mark those intermediate end results as the source (root) of the some clause
  //so that it doesn't retrace the source until the very source of the where clause
  //for example p.where(p.friends.some((f) => { return f.name.equals('Moa');}));
  //the result of p.friends will be the intermediate "queryEndResult", which is where the result of f.name.equals should be traced back to and compared with
  // instead of retracting it all the way back to p
  if (queryEndValues instanceof QueryShapeSet) {
    (queryEndValues as QueryShapeSet).setSource(true);
  }
  let matchingSubjects = resolveWhere(queryEndValues, evaluation);

  if (queryEndValues instanceof QueryShapeSet) {
    (queryEndValues as QueryShapeSet).setSource(false);
  }
  return matchingSubjects;
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

function resolveQueryStep(
  subject: ShapeSet | Shape[] | Shape,
  queryStep: QueryStep,
) {
  //YOU ARE HERE, add implementation for shape, do it DRY
  if (subject instanceof Shape) {
    if (queryStep.property) {
      let result = subject[queryStep.property.label];
      if (queryStep.where) {
        //TODO: not thought through yet, we also use this function now to resolve where's itself. what do we want to do here?
        debugger;
        let whereResult = resolveWhere(result, queryStep.where);
        //overwrite the single result with the filtered where result
        result = whereResult;
      }
      return result;
    } else if (queryStep.where) {
      //in some cases there is a query step without property but WITH where
      //this happens when the where clause is on the root of the query
      //like Person.select(p => p.where(...))
      //in that case the where clause is directly applied to the given subject
      debugger;
      // let whereResult = resolveWhere(subject as ShapeSet, queryStep.where);
      // return whereResult;
    }
  }
  if (subject instanceof ShapeSet) {
    //if the propertyshape states that it only accepts literal values in the graph,
    // then the result will be an Array
    if (queryStep.property) {
      let result =
        queryStep.property.nodeKind === shacl.Literal || queryStep.count
          ? []
          : new ShapeSet();
      (subject as ShapeSet).forEach((singleShape) => {
        //directly access the get/set method of the shape
        let stepResult = singleShape[queryStep.property.label];
        if (queryStep.where) {
          let whereResult = resolveWhere(stepResult, queryStep.where);
          //overwrite the single result with the filtered where result
          stepResult = whereResult;
        }
        if (queryStep.count) {
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
              queryStep.property.label +
              ' on shape ' +
              singleShape.toString() +
              ')',
          );
        }
      });
      return result;
    } else if (queryStep.where) {
      //in some cases there is a query step without property but WITH where
      //this happens when the where clause is on the root of the query
      //like Person.select(p => p.where(...))
      //in that case the where clause is directly applied to the given subject
      let whereResult = resolveWhere(subject, queryStep.where);
      return whereResult;
    }
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}
function resolveWhereStep(
  subject: QueryValue | QueryPrimitiveSet | QueryValueSetOfSets,
  queryStep: QueryStep,
): QueryValueSetOfSets | QueryPrimitiveSet {
  if (subject instanceof QueryValueSetOfSets) {
    let res = new QueryValueSetOfSets(
      subject.map((singleSubject: QueryShapeSet) => {
        return singleSubject.callPropertyShapeAccessor(
          queryStep.property,
        ) as unknown as QueryShapeSet;
      }),
    );
    if (queryStep.count) {
      debugger;
      //NOTE: we need to refactor how where clauses are done, before finishing this
      // res = new QueryPrimitiveSet(null,null,res.map(shapeSet => {
      //   return new QueryNumber(shapeSet as Set<any>).size
      // }))
    }
    //TODO: check types
    return res as unknown as QueryValueSetOfSets;
  } else if (subject instanceof QueryShapeSet) {
    return subject.callPropertyShapeAccessor(queryStep.property);
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}
