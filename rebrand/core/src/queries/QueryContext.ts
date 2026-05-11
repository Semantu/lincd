import {QShape, QueryShape} from './SelectQuery.js';
import {Shape} from '../shapes/Shape.js';

const queryContext = new Map<string, QShape<any, any, any>>();

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
  if (value && typeof value.id === 'string') {
    //convert to QShape
    if (!shapeType) {
      console.warn(
        'setQueryContext: value is a QResult but no shapeType provided',
        value,
      );
      return;
    }
    const shape = new (shapeType as any)();
    shape.id = value.id;
    shape.__queryContextId = value.id;
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
