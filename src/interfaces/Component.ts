import {Node} from '../models';
import {Shape} from '../shapes/Shape';
import {PropertyShape} from '../shapes/SHACL';
import {ShapeSet} from '../collections/ShapeSet';
import {NodeSet} from '../collections/NodeSet';
import {ICoreIterable} from './ICoreIterable';
import {
  ComponentQueryPath,
  QueryPath,
  QueryPropertyPath,
  QueryShape,
  QueryShapeSet,
  QueryBuilderObject,
  LinkedQuery,
  LinkedQueryObject,
  QResult,
  QueryControllerProps,
} from '../utils/LinkedQuery';
import React from 'react';

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | LinkedFunctionalComponent<P, ShapeType>
  | LinkedFunctionalSetComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}

export interface BoundFunctionalComponentFactory<
  P,
  ShapeType extends Shape = Shape,
> {
  _create: (props: PropertyShape[]) => LinkedFunctionalComponent<P, ShapeType>;
  _setLoaded?: (quads) => void;
  _props?: PropertyShape[];
  _comp: LinkedFunctionalComponent<P, ShapeType>;
  getPropertyPath?: () => ComponentQueryPath;
}

export interface BoundSetComponentFactory<
  P = {},
  ShapeType extends Shape = Shape,
> {
  _create: (
    props: PropertyShape[],
  ) => LinkedFunctionalSetComponent<P, ShapeType>;
  _setLoaded?: (quads) => void;
  _childDataRequest: LinkedDataRequest;
  _props?: PropertyShape[];
  _comp: LinkedFunctionalSetComponent<P, ShapeType>;
}

export interface LinkedFunctionalComponent<P, ShapeType extends Shape = Shape>
  extends React.FC<
    P & LinkedComponentInputProps<ShapeType> & React.ComponentPropsWithRef<any>
  > {
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  // of?: (source?: Node | Shape) => BoundComponentFactory<P, ShapeType>;
  of?: (source?: QueryShape<ShapeType>) => BoundComponentFactory<P, ShapeType>;
  original?: LinkableFunctionalComponent<P, ShapeType>;
  query?: LinkedQueryObject<any>;
  setLoaded?: (source?: Shape) => void;
  shape?: typeof Shape;
}

export interface LinkedFunctionalSetComponent<
  P,
  ShapeType extends Shape = Shape,
> extends React.FC<
    P &
      LinkedSetComponentInputProps<ShapeType> &
      React.ComponentPropsWithRef<any>
  > {
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  of?: (
    sources: QueryShapeSet<ShapeType>, //NodeSet | ShapeSet,
    itemRequestFn?:
      | LinkedFunctionalComponent<any, ShapeType>
      | ((shape: ShapeType) => LinkedDataResponse),
  ) => BoundSetComponentFactory<P, ShapeType>;
  original?: LinkableFunctionalSetComponent<P, ShapeType>;
  query?: LinkedQueryObject<any>;

  shape?: typeof Shape;
  setLoaded?: (source?: ShapeSet<ShapeType>) => void;
}

export type LinkableFunctionalComponent<
  P,
  ShapeType extends Shape = Shape,
> = React.FC<P & LinkedComponentProps<ShapeType>>;
export type LinkableFunctionalSetComponent<
  P,
  ShapeType extends Shape = Shape,
  DataResultType = any,
> = React.FC<LinkedSetComponentProps<ShapeType, DataResultType> & P>;

export interface LinkedSetComponentProps<
  ShapeType extends Shape,
  DataResultType = any,
> extends LinkedComponentBaseProps<DataResultType>,
    QueryControllerProps {
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  sources: ShapeSet<ShapeType>;
}

export interface LinkedComponentProps<ShapeType extends Shape>
  extends LinkedComponentBaseProps {
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  source: ShapeType;
}

interface LinkedComponentBaseProps<DataResultType = any>
  extends React.PropsWithChildren {
  /**
   * Then linkedData will be the result of the data request, if defined.
   * linkedData will either be an array or an object, matching the function defined in this very component
   * See the first parameter of linkedComponent(). If a data request is made with Shape.request()
   * e.g: linkedComponent(Shape.request((shapeInstance) => ...)) then linkedData is defined.
   * If simply a Shape class was given as first parameter, only source will be defined, and linkedData will be undefined.
   */
  linkedData?: DataResultType;
}

export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  /**
   * The primary set of data sources that this component will represent.
   * Can be a set of Nodes in the graph or a set of instances of the Shape that this component uses
   */
  of?: NodeSet | ShapeSet<ShapeType> | QResult<ShapeType>[];
  as?: React.FC | LinkedFunctionalComponent<any, ShapeType>;
}

export interface LinkedComponentInputProps<ShapeType extends Shape = Shape>
  extends LinkedComponentInputBaseProps {
  /**
   * The primary data source that this component will represent.
   * Can be a Node in the graph or an instance of the Shape that this component uses
   */
  of: Node | ShapeType | QResult<ShapeType>;
}

export interface BoundComponentProps {
  /**
   * If isBound is true, then this component was bound to a specific source by the parent component that uses it.
   * Amongst other things, this means the component can expect its data was already loaded by the parent.
   */
  isBound?: boolean;
}

interface LinkedComponentInputBaseProps extends React.PropsWithChildren {
  /**
   * Add class name(s) to the top level DOM element of this component
   * A single class name or an array of classnames. Empty entries are allowed and will be filtered
   * e.g. className={[style.defaultClass,activeState && style.activeClass]}
   */
  className?: string | string[];

  /**
   * Add styles to the top level DOM element of this component
   */
  style?: React.CSSProperties;
}

export type BoundComponentFactory<P = {}, ShapeType extends Shape = Shape> =
  | BoundFunctionalComponentFactory<P, ShapeType>
  | BoundSetComponentFactory<P, ShapeType>;

export type ResponseUnit =
  | Node
  | Shape
  | string
  | number
  | boolean
  | ICoreIterable<Node | Shape | string | number | boolean>;
export type LinkedDataResponse =
  | (() => BoundComponentFactory<any, any>)
  | (ResponseUnit | ((() => BoundComponentFactory<any, any>) | ResponseUnit))[]
  | {
      [key: string]:
        | ResponseUnit
        | ((() => BoundComponentFactory<any, any>) | ResponseUnit);
    };
export type TransformedLinkedDataResponse =
  | BoundComponentFactory<any, any>
  | (ResponseUnit | (BoundComponentFactory<any, any> | ResponseUnit))[]
  | {
      [key: string]:
        | ResponseUnit
        | (BoundComponentFactory<any, any> | ResponseUnit);
    };

export type LinkedDataDeclaration<T> = {
  shape: typeof Shape;
  request: LinkedDataRequestFn<T>;
};
export type LinkedDataChildRequestFn<T> =
  | LinkedFunctionalComponent<T>
  | LinkedDataRequestFn<T>;
export type LinkedDataRequestFn<T> = (shapeOrShapeSet: T) => LinkedDataResponse;

export type LinkedDataSetDeclaration<T extends Shape> = {
  shape: typeof Shape;
  setRequest?: LinkedDataRequestFn<ShapeSet<T>>;
  request?: LinkedDataRequestFn<T>;
};

export declare type SubRequest = LinkedDataRequest;
/**
 * An array of requested property shapes.
 * If you want to request specific property shapes of another property shape (this is called a SubRequest)
 * then replace a property shape with an array that contains the main property shape as the first element, and an array of property shapes as subRequest of that main property shape
 * e.g.: [shape1,[shape2,[shape3,shape4]]] will request shape 3 & 4 of shape 2
 */
export declare type LinkedDataRequest = SingleDataRequest[];
export declare type SingleDataRequest =
  | PropertyShape
  | [PropertyShape, SubRequest];

//{"?s":["rdf:type", "foaf:name"]}
export type QuerySelectObject = {
  [key: string]: QuerySelectUnit[];
};
export type QuerySelectUnit = string | QuerySelectObject;
export type LinkedDataGenericQuery = {
  // "@context": context,        // optional
  select: LinkedDataRequest;
  where: [string, string, string][];
  // "groupBy": group-by-clause, // optional
  // "having": having-clause     // optional
};

export type LinkedDataPreparedQuery = {
  select: QuerySelectObject;
  where: [string, string, string][];
};

// where: [[{method: "count", subject: propshape}, ">", 1], [...]]
export function removeBoundComponents(
  request: ComponentQueryPath[],
): QueryPath[] {
  if (Array.isArray(request)) {
    return request.map((queryPath: ComponentQueryPath) => {
      if (Array.isArray(queryPath)) {
        return queryPath.filter((queryStep) => {
          // debugger;
          //TODO: review
          // if ((queryStep as BoundComponentQueryStep).component) {
          //   return false;
          // }
          return true;
        }) as QueryPath;
      } else {
        //TODO: filter out bound components for this sort of query
        throw Error('Not implemented');
        debugger;
        // request as WherePath;
      }
    }) as QueryPath[];
  } else {
    throw new Error(
      'TODO: implement support for custom query object: ' + request,
    );
  }
}
