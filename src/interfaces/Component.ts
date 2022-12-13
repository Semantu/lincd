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
export interface LinkedFunctionalComponent<P,ShapeType extends Shape = Shape> extends FunctionalComponent<Omit<Omit<P, 'source'>, 'sourceShape'> & LinkedComponentProps<ShapeType>, ShapeType> {
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  of?: (source?: Node|Shape) => BoundComponentFactory<P,ShapeType>;
  original?: FunctionalComponent<P, ShapeType>;
  dataRequest?: LinkedDataRequest;
  shape?: typeof Shape;
}
export interface FunctionalComponent<P, ShapeType extends Shape = Shape>
  extends React.FC<P & LinkedComponentProps<ShapeType>> {
  (props: P & LinkedComponentProps<ShapeType>): any;
}

export interface FunctionalComponentDeclaration<
  P extends LinkedComponentDeclarationProps,
  ShapeType extends Shape = Shape,
> extends React.FC<P> {
  (props: P & LinkedComponentProps<ShapeType>): any;

  shape?: typeof Shape;
}

export interface LinkedComponentDeclarationProps<ShapeType extends Shape = Shape> {
  source: Node;
  sourceShape: ShapeType;
}

export interface LinkedComponentProps<ShapeType extends Shape = Shape> {
  /**
   * A node in the graph that serves as the main data source of this component. The thing that this component visualises. .
   */
  source?: Node;
  /**
   * The same node as `source` but now as an instance of the Shape that this component is linked to.
   * @example
   * If your component `PersonView` is connected to the shape class `Person`, you would provide it a node `<PersonView source={personNode} />` but internally, PersonView can access sourceShape, which will be an instance of Person
   */
  sourceShape?: ShapeType;
}
