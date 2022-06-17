import {Node} from '../models';
import {Shape} from '../shapes/Shape';

interface IClassConstruct {
	new (): any;
	prototype: any;
}

export type Component<P = any, ShapeType extends Shape = Shape> =
	| ClassComponent<P, ShapeType>
	| FunctionalComponent<P, ShapeType>;

export interface ClassComponent<P, ShapeType extends Shape = Shape>
	extends IClassConstruct {
	props: P;
	shape?: typeof Shape;
}

export interface FunctionalComponent<P, ShapeType extends Shape = Shape> {
	(props: P & ComponentProps<ShapeType>): any;
	shape?: typeof Shape;
}

export interface ComponentProps<ShapeType extends Shape = Shape> {
	source?: Node;
	className?: string;
	sourceShape?: ShapeType;
}
