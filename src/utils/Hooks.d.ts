import { NodeValuesSet } from '../collections/NodeValuesSet.js';
import { ShapeValuesSet } from '../collections/ShapeValuesSet.js';
import { Shape } from '../shapes/Shape.js';
import { NamedNode } from '../models.js';
/**
 * Merges styles and class names from props with the classnames & styles given as arguments
 * @param props
 * @param classNamesOrStyles class name(s) or a style object
 * @param styles option to provide a style object if class names were given as first argument
 */
export declare const useStyles: (props: any, classNamesOrStyles?: string | string[] | React.CSSProperties, styles?: React.CSSProperties) => any;
/**
 * Updates your component automatically when the values for a given subject+predicate ValuesSet change
 * @param valuesSet
 */
export declare const useWatchPropertySet: (...valuesSets: (NodeValuesSet | ShapeValuesSet<any>)[]) => void;
/**
 * Updates your component automatically when the values of the given property change for the given source
 * If you provide a shape as the source, you can use the property name (the name of the get-method) instead of a NamedNode as the property argument
 * @param source a NamedNode or Shape
 * @param property a NamedNode or a string (the name of the get-method of the Shape)
 */
export declare function useWatchProperty(source: NamedNode, property: NamedNode): any;
export declare function useWatchProperty(source: Shape, property: NamedNode | string): any;
