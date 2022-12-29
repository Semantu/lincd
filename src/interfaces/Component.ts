import {Node} from '../models';
import {BoundComponentFactory,LinkedDataDeclaration,LinkedDataRequest,LinkedDataResponse,Shape} from '../shapes/Shape';
import {PropertyShape} from '../shapes/SHACL';
import {ShapeSet} from '../collections/ShapeSet';
import {NodeSet} from '../collections/NodeSet';

export type Component<P = any, ShapeType extends Shape = Shape> =
  | ClassComponent<P, ShapeType>
  | LinkedFunctionalComponent<P, ShapeType>
  | LinkedFunctionalSetComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
  extends React.ComponentClass<P & LinkedComponentProps<ShapeType>> {
  props: P & LinkedComponentProps<ShapeType>;
  shape?: typeof Shape;
}
export interface BoundFunctionalComponentFactory<P,ShapeType extends Shape = Shape> {
  _create:(props:PropertyShape[]) => LinkedFunctionalComponent<P, ShapeType>;
  _props?:PropertyShape[];
  _comp:LinkedFunctionalComponent<P,ShapeType>
}
export interface BoundSetComponentFactory<P={},ShapeType extends Shape = Shape> {
  _create:(props:PropertyShape[]) => LinkedFunctionalSetComponent<P, ShapeType>;
  _childDataRequest:LinkedDataRequest;
  _props?:PropertyShape[];
  _comp:LinkedFunctionalSetComponent<P,ShapeType>
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
export interface LinkedFunctionalSetComponent<P,ShapeType extends Shape = Shape> extends React.FC<P & LinkedSetComponentInputProps<ShapeType>> {
  /**
   * Binds a component to a source. Usually used in Shape.request() for automatic data loading.
   * @param source the node or shape that this component should visualise
   */
  of?: (sources: NodeSet|ShapeSet,itemRequestFn?:(shape:ShapeType)=>LinkedDataResponse) => BoundSetComponentFactory<P,ShapeType>;
  original?: LinkableFunctionalSetComponent<P,ShapeType>;
  dataRequest?: LinkedDataRequest;
  shape?: typeof Shape;
  getChildLinkedData?: (shapeInstance: ShapeType) => LinkedDataResponse
}
export type LinkableFunctionalComponent<P,ShapeType extends Shape = Shape> = React.FC<P & LinkedComponentProps<ShapeType>>;
export type LinkableFunctionalSetComponent<P,ShapeType extends Shape = Shape> = React.FC<P & LinkedSetComponentProps<ShapeType>>;


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

export interface LinkedSetComponentProps<ShapeType extends Shape> extends LinkedComponentBaseProps
{
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  sources: ShapeSet<ShapeType>;

  /**
   * Retrieves the linked data for a specific child, as defined in the data request of the component that uses this SetComponent.
   * Example, take this component that uses Grid:
   * ```tsx
   * const PersonFriends = linkedComponent(Person.request(person => ({
   *   Grid.of(person.friends, (friend) => ({
   *     Avatar: PersonAvatar.of(friend)
   *   }))
   * })),({linkedData:{Friends}}) => {
   *   return <div>Friend list:
   *     <Friends>{({linkedData: {Avatar}}) => {
   *       return <Avatar />;
   *     }}</Friends>
   *   </div>
   * })
   * ```
   *
   * The method above that starts with (friends) => ({Avatar:...}) is the function that retrieves and links the data for each item in `person.friends`
   * IN Grid, that function is available as the prop `getChildLinkedData` for Grid. So that it can obtain the linked data of each item it displays like this:
   *
   * ```tsx
   * sources.map(source =>
   *  <ChildComponent of={source} linkedData={getChildLinkedData(source)} />
   * );
   * ```
   *
   * Here's an example implementation of a Grid component, which assumes it receives a child-render-function as its only child :
   * ```tsx
   * export const Grid = linkedSetComponent(Shape,({sources,children,getChildLinkedData}) => {
   *   return (
   *     <div className={style.Grid}>
   *       {sources.map((source) => {
   *         return children({
   *           source,
   *           linkedData:getChildLinkedData(source)
   *         });
   *       })
   *     </div>
   *   );
   * });
   * ```
   * @param shapeInstance
   */
  getChildLinkedData?: (shapeInstance: ShapeType) => LinkedDataResponse

}
export interface LinkedComponentProps<ShapeType extends Shape> extends LinkedComponentBaseProps {
  /**
   * An instance of the Shape that this component is linked to.
   * Users of this component can provide this shape with the property of: of={nodeOrShapeInstance}
   * if a node was given for 'of', linkedComponent() converts that node into an instance of the shape and provides it as 'source'
   */
  source: ShapeType;
}
interface LinkedComponentBaseProps extends React.PropsWithChildren {
  /**
   * Then linkedData will be the result of the data request, if defined.
   * linkedData will either be an array or an object, matching the function defined in this very component
   * See the first parameter of linkedComponent(). If a data request is made with Shape.request()
   * e.g: linkedComponent(Shape.request((shapeInstance) => ...)) then linkedData is defined.
   * If simply a Shape class was given as first parameter, only source will be defined, and linkedData will be undefined.
   */
  linkedData?:any;

}

export interface LinkedSetComponentInputProps<ShapeType extends Shape = Shape> extends LinkedComponentInputBaseProps {
  /**
   * The primary set of data sources that this component will represent.
   * Can be a set of Nodes in the graph or a set of instances of the Shape that this component uses
   */
  of: NodeSet|ShapeSet<ShapeType>;
}
export interface LinkedComponentInputProps<ShapeType extends Shape = Shape> extends LinkedComponentInputBaseProps {
  /**
   * The primary data source that this component will represent.
   * Can be a Node in the graph or an instance of the Shape that this component uses
   */
  of: Node|ShapeType;
}
interface LinkedComponentInputBaseProps {

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