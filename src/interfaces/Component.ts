import {Node} from '../models';
import {Shape} from '../shapes/Shape';

// interface IClassConstruct {
// 	new (): any;
// 	prototype: any;
// }

export type Component<P = any, ShapeType extends Shape = Shape> =
	| ClassComponent<P, ShapeType>
	| FunctionalComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape> extends React.ComponentClass<P & LinkedComponentProps<ShapeType>>
{
	props: P & LinkedComponentProps<ShapeType>;
	shape?: typeof Shape;
}

export interface FunctionalComponent<P, ShapeType extends Shape = Shape> extends React.FC<P & LinkedComponentProps<ShapeType>> {
	(props: P & LinkedComponentProps<ShapeType>): any;
	shape?: typeof Shape;
}

export interface LinkedComponentProps<ShapeType extends Shape = Shape> {
	source?: Node;
	sourceShape?: ShapeType;
}
