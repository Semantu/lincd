import {
  LinkedQuery,
  LinkedWhereQuery,
  OriginalValue,
  QueryPath,
  QueryPrimitive,
  QueryPrimitiveSet,
  QueryShapeSet,
  QueryStep,
  QueryValue,
  ToNormalValue,
  WhereAnd,
  WhereEvaluationPath,
  WhereMethods,
  WherePath,
} from './LinkedQuery';
import {ShapeSet} from '../collections/ShapeSet';
import {Shape} from '../shapes/Shape';
import {shacl} from '../ontologies/shacl';
import {resolve} from 'eslint-import-resolver-typescript';

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
function resolveWhere(
  subject: Shape | ShapeSet,
  where: WherePath,
): OriginalValue | OriginalValue[] {
  let convertedSubjects = QueryValue.convertOriginal(subject, null, null);

  if ((where as WhereEvaluationPath).path) {
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
    return QueryValue.getOriginalSource(queryEndValues);
    // return null;
    // }
  } else if ((where as WhereAnd).and) {
    //YOU ARE HERE
    // let queryEndValues = resolveWhere(convertedSubjects, (where as WhereAnd).and);
    // if (queryEndValues instanceof QueryPrimitiveSet) {
    //   queryEndValues = queryEndValues.filter(
    //     resolveWhereEquals.bind(null, (where as WhereAnd).args),
    //   ) as any;
    // }
    // return QueryValue.getOriginalSource(queryEndValues);
  }

  //YOU ARE HERE, where will resolve itself. instead of resolveWherePath
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
