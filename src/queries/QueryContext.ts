import {useEffect} from 'react';
import {type QShape, QueryShape} from './SelectQuery.js';
import {Shape} from '../shapes/Shape.js';
import {TestNode} from '../utils/TraceShape.js';

const queryContext = new Map<string, QShape<any, any, any>>();

export function useQueryContext(name: string, initialData: any, shapeType) {
  useEffect(() => {
    setQueryContext(name, initialData, shapeType);
  }, [initialData, name]);
}

export function getQueryContext<T extends Shape>(name: string): QShape<T> {
  if (!queryContext.has(name)) {
    //TODO:should return something here so that the query still works and returns default values
    // like NullQueryShape or similar
    return null;
  }
  return queryContext.get(name);
}

export function setQueryContext(name: string, value: any, shapeType?) {
  //if a QResult was provided
  if (
    value &&
    (typeof value.id === 'string' || typeof value.uri === 'string')
  ) {
    //convert to QShape
    if (!shapeType) {
      console.warn(
        'setQueryContext: value is a QResult but no shapeType provided',
        value,
      );
      return;
    }
    const testNode = new TestNode();
    testNode.targetID = value.id || value.uri;
    const shape = new (shapeType as any)(testNode); //.getFromURI(value.id);
    value = QueryShape.create(shape);
    //const converted = QueryBuilderObject.convertOriginal(shape,null,null);
  }
  if (value instanceof Shape) {
    //convert to QShape
    value = new QueryShape(value);
  } else if (value && !(value instanceof QueryShape)) {
    console.warn('setQueryContext: value is not a QueryShape or Shape', value);
    return;
  }

  queryContext.set(name, value);
}
