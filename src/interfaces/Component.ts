import {Node} from '../models';
import {LinkedDataRequest,Shape} from '../shapes/Shape';
import {PropertyShape} from '../shapes/SHACL';

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | LinkedFunctionalComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}
export interface BoundComponentFactory<P,ShapeType extends Shape = Shape> {
  _create:(props:PropertyShape[]) => LinkedFunctionalComponent<P, ShapeType>;
  _props?:PropertyShape[];
  _comp:LinkedFunctionalComponent<P,ShapeType>
}
export interface LinkedFunctionalComponent<P,ShapeType extends Shape = Shape> extends React.FC<P & LinkedComponentInputProps<ShapeType>> {
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  of?: (source?: Node|Shape) => BoundComponentFactory<P,ShapeType>;
  original?: LinkableFunctionalComponent<P,ShapeType>;
  dataRequest?: LinkedDataRequest;
  shape?: typeof Shape;
}
export type LinkableFunctionalComponent<P,ShapeType extends Shape = Shape> = React.FC<P & LinkedComponentProps<ShapeType>>;
// export interface FunctionalComponent<P, ShapeType extends Shape = Shape>
//   extends React.FC<P & LinkedComponentProps<ShapeType>> {
//   (props: P & LinkedComponentProps<ShapeType>): any;
// }

/*export interface FunctionalComponentDeclaration<
  P extends LinkedComponentDeclarationProps,
  ShapeType extends Shape = Shape,
> extends React.FC<P> {
  (props: P & LinkedComponentProps<ShapeType>): any;

  shape?: typeof Shape;
}*/

/*export interface LinkedComponentDeclarationProps<ShapeType extends Shape = Shape> {
  source: Node;
  sourceShape: ShapeType;
}*/

export interface LinkedComponentProps<ShapeType extends Shape = Shape> {
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with <YourComponent of={nodeOrShapeInstance} />
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  source: ShapeType;

  /**
   * Then linkedData will be the result of the data request, if defined.
   * linkedData will either be an array or an object, matching the function defined in this very component
   * See the first parameter of linkedComponent(). If a data request is made with Shape.request()
   * e.g: linkedComponent(Shape.request((shapeInstance) => ...)) then linkedData is defined.
   * If simply a Shape class was given as first parameter, only source will be defined, and linkedData will be undefined.
   */
  linkedData?:any;
}
export interface LinkedComponentInputProps<ShapeType extends Shape = Shape> {
  /**
   * The primary data source that this component will represent.
   * Can be a Node in the graph or an instance of the Shape that this component uses
   */
  of: Node|ShapeType;

  /**
   * Add class name(s) to the top level DOM element of this component
   * A single class name or an array of classnames. Empty entries are allowed and will be filtered
   * e.g. className={[style.defaultClass,activeState && style.activeClass]}
   */
  className?:string|string[];

  /**
   * Add styles to the top level DOM element of this component
   */
  style?:React.CSSProperties;
}
