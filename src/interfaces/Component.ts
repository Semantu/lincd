import {Node} from '../models';
import {Shape} from '../shapes/Shape';

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | FunctionalComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}

export interface FunctionalComponent<P, ShapeType extends Shape = Shape>
  extends React.FC<P & LinkedComponentProps<ShapeType>> {
  (props: P & LinkedComponentProps<ShapeType>): any;
  shape?: typeof Shape;
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
