import {
  LinkedQuery,
  LinkedWhereQuery,
  OriginalValue,
  QueryPath,
  QueryPrimitive,
  QueryPrimitiveSet,
  QueryShape,
  QueryShapeSet,
  QueryStep,
  QueryValue,
  ToNormalValue,
  WhereAnd,
  WhereAndOr,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
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

  if (
    query.traceResponse.whereQuery &&
    query.traceResponse instanceof QueryShape
  ) {
    localInstances = resolveWhere(
      localInstances,
      query.traceResponse.whereQuery.getWherePath(),
    );
  }
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
// private resolveQueryPaths(localInstance, queryPaths: QueryPath[]) {
//   let shapeResult = [];
//   queryPaths.forEach((queryPath) => {
//     shapeResult.push(query.resolveQueryPath(localInstance, queryPath));
//   });
//   return shapeResult;
// }

function resolveWherePath(subject: QueryValue, queryPath: QueryPath) {
  //start with the subject as the current "end result"
  let result: QueryValue = subject;
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
  return result as ShapeSet | Shape[] | Shape;
}
// private resolveQueryPath(localInstance, queryPath: QueryPath) {
//   //start with the local instance as the subject
//   let result = localInstance;
//   queryPath.forEach((queryStep) => {
//     //then resolve each of the query steps and use the result as the new subject for the next step
//     result = this.resolveQueryStep(result, queryStep);
//   });
//   //return the final value at the end of the path
//   return result;
// }

/**
 * Filters down the given subjects to only those what match the where clause
 * @param subject
 * @param where
 * @private
 */
function resolveWhere(subject: Shape | ShapeSet, where: WherePath): ShapeSet {
  if ((where as WhereEvaluationPath).path) {
    let convertedSubjects = QueryValue.convertOriginal(subject, null, null);
    let queryEndValues = resolveWherePath(
      convertedSubjects,
      (where as WhereEvaluationPath).path,
    );

    if ((where as WhereEvaluationPath).method === WhereMethods.STRING_EQUALS) {
      if (queryEndValues instanceof QueryPrimitiveSet) {
        queryEndValues = queryEndValues.filter(
          resolveWhereEquals.bind(null, (where as WhereEvaluationPath).args),
        ) as any;
      }
    } else {
      throw new Error(
        'Unimplemented where method: ' + (where as WhereEvaluationPath).method,
      );
    }
    //once the filtering of the where clause is done, we need to convert the result back to the original shape
    //for example Person.select(p => p.friends.where(f => f.name.equals('Semmy')))
    //the result of the where clause is an array of names (strings),
    //but we need to return the filtered result of p.friends (which is a ShapeSet of Persons)
    return QueryValue.getOriginalSource(queryEndValues) as ShapeSet;
    // return null;
    // }
  } else if ((where as WhereAndOr).andOr) {
    //the first run we simply take the result as the combined result
    let initialResult: ShapeSet = resolveWhere(
      subject,
      (where as WhereAndOr).firstPath,
    );

    //Next we process the AND clauses. To do this, we combine the results of any AND clause with the previous WherePath
    //For example p.friends.where(f => f.name.equals('Semmy')).and.where(f => f.age.equals(30))
    //Then the results of f.name.equals is the initial path, which gets combined with the results of f.age.equals

    //TODO: prepare this once, before resolveWhere is called. Currently we do this for every results moving through the where clause
    //first we make a new array that tracks the intermediate results.
    //so we resolve all the where paths and add them to an array
    type AndSet = {and: ShapeSet};
    type OrSet = {or: ShapeSet};
    let booleanPaths: (ShapeSet | AndSet | OrSet)[] = [initialResult];
    (where as WhereAndOr).andOr.forEach((andOr) => {
      if (andOr.and) {
        //if there is an and, we add the result of that and to the array
        booleanPaths.push({and: resolveWhere(subject, andOr.and)});
      } else if (andOr.or) {
        //if there is an or, we add the result of that or to the array
        booleanPaths.push({or: resolveWhere(subject, andOr.or)});
      }
    });

    //Say that we have: booleanPaths = [ShapeSet,{and:ShapeSet},{or:ShapeSet},{and:ShapeSet}]
    //We should first process the AND: by combining the results of 0 & 1 and also 2 & 3
    //So that it becomes: booleanPaths = [ShapeSet,{or:ShapeSet}]
    // let previous:any;
    var i = booleanPaths.length;
    while (i--) {
      let previous = booleanPaths[i - 1];
      let current = booleanPaths[i];

      if (!previous) break;
      //if the previous is a ShapeSet and the current is a ShapeSet, we combine them
      if ((current as AndSet).and) {
        let filterFn = (result) => {
          return (current as AndSet).and.has(result);
        };
        if (previous instanceof ShapeSet) {
          booleanPaths[i - 1] = previous.filter(filterFn);
        } else if ((previous as OrSet).or) {
          (previous as OrSet).or = (previous as OrSet).or.filter(filterFn);
        } else if ((previous as AndSet).and) {
          (previous as AndSet).and = (previous as AndSet).and.filter(filterFn);
        }
        //remove the current item from the array now that its processed
        booleanPaths.splice(i, 1);
      }
    }

    //next we process the OR clauses
    var i = booleanPaths.length;
    while (i--) {
      let previous = booleanPaths[i - 1];
      let current = booleanPaths[i];

      if (!previous) break;

      //for all or clauses, keep the results that are in either of the sets, so simply combine them
      if ((current as OrSet).or) {
        if (previous instanceof ShapeSet) {
          booleanPaths[i - 1] = previous.concat((current as OrSet).or);
        } else if ((previous as OrSet).or) {
          (previous as OrSet).or.concat((previous as OrSet).or);
        } else if ((previous as AndSet).and) {
          (previous as AndSet).and.concat((previous as OrSet).or);
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
    return booleanPaths[0] as ShapeSet;

    //so in both cases, the WherePath of the previous one is replaced with the combination

    //go over the array of ands & ors
    //and first process the ands, by combining the current and the previous and/or
    // for (let key in (where as WhereAndOr).andOr) {
    //   let andOr = (where as WhereAndOr).andOr[key];
    //   if (andOr.and) {
    //     let andResult = resolveWhere(subject, andOr.and);
    //     //only keep the results that are in both arrays
    //     combinedResults = combinedResults.filter((result) => {
    //       return andResult.has(result);
    //     });
    //   }
    // }
    //
    // //then process the or's by combining the current and the previous and/or
    //
    // (where as WhereAndOr).andOr.forEach((andOr) => {
    //   if (andOr.and) {
    //     let andResult = resolveWhere(subject, andOr.and);
    //     //only keep the results that are in both arrays
    //     combinedResults = combinedResults.filter((result) => {
    //       return andResult.has(result);
    //     });
    //   } else if (andOr.or) {
    //     let orResult = resolveWhere(subject, andOr.or);
    //     //keep the results that are in either of the arrays, so simply combine them
    //     //but don't add duplicates
    //     //YOU ARE HERE. TEST THIS
    //     combinedResults = combinedResults.concat(
    //       orResult.filter((result) => {
    //         return !combinedResults.has(result);
    //       }),
    //     );
    //   }
    // });
    // return combinedResults;
  }

  //TODO: where can resolve itself. instead of resolveWherePath
  // return where.resolve(convertedSubjects);
}

function resolveWhereEquals(args: any[], queryEndValue: QueryPrimitive) {
  return queryEndValue.value === args[0];
}

function resolveQueryStep(
  subject: ShapeSet | Shape[] | Shape,
  queryStep: QueryStep,
) {
  // if (subject instanceof Shape) {
  //   return subject[queryStep.property.label];
  // }
  if (subject instanceof ShapeSet) {
    //if the propertyshape states that it only accepts literal values in the graph,
    // then the result will be an Array
    let result =
      queryStep.property.nodeKind === shacl.Literal ? [] : new ShapeSet();
    (subject as ShapeSet).forEach((singleShape) => {
      let stepResult = singleShape[queryStep.property.label];
      if (queryStep.where) {
        let whereResult = resolveWhere(stepResult, queryStep.where);
        //overwrite the single result with the filtered where result
        stepResult = whereResult;
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
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}
function resolveWhereStep(
  subject: QueryValue,
  queryStep: QueryStep,
): QueryValue {
  if (
    subject instanceof QueryShapeSet
    //&&
    // (subject as QueryShapeSet<any>).originalValue instanceof ShapeSet
  ) {
    return subject.callPropertyShapeAccessor(queryStep.property);
  } else {
    throw new Error('Unknown subject type: ' + typeof subject);
  }
}
