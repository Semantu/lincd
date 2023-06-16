import {NodeValuesSet} from '../collections/NodeValuesSet';
import {useCallback,useEffect} from 'react';
import useState from 'react-usestateref';
import {ShapeValuesSet} from '../collections/ShapeValuesSet';
import {Shape} from '../shapes/Shape';
import {NamedNode} from '../models';
import {getShapeClass,getSubShapesClasses,getSuperShapesClasses} from './ShapeClass';

/**
 * Merges styles and class names from props with the classnames & styles given as arguments
 * @param props
 * @param classNamesOrStyles class name(s) or a style object
 * @param styles option to provide a style object if class names were given as first argument
 */
export const useStyles = (
  props,
  classNamesOrStyles?: string | string[] | React.CSSProperties,
  styles?: React.CSSProperties,
) => {
  let classNames;
  let combinedStyles;
  let propsCopy = {...props};
  if (props.className) {
    if (typeof props.className === 'string') {
      classNames = [props.className];
    } else if (Array.isArray(props.className)) {
      classNames = props.className;
    }
    delete propsCopy.className;
  }
  if (props.style) {
    combinedStyles = props.style;
    delete propsCopy.style;
  }

  if (classNamesOrStyles) {
    let paramType = typeof classNamesOrStyles;
    if (paramType === 'string') {
      if (classNames) {
        classNames.push(classNamesOrStyles);
      } else {
        classNames = [classNamesOrStyles];
      }
    } else if(paramType === 'object') {
      if (Array.isArray(classNamesOrStyles)) {
        if (classNames) {
          classNames = classNames.concat(classNamesOrStyles);
        } else {
          classNames = classNamesOrStyles;
        }
      }
      else
      {
        //merge props.style with first param (which is a React.CSSProperties object)
        combinedStyles = {...props.style,...classNamesOrStyles as object}
      }
    }
    if(styles) {
      //merge props.style with second param (first param must have been class names)
      combinedStyles = {...combinedStyles,...styles}
    }
  }

  return {className: classNames.filter(Boolean).join(' '), style: combinedStyles,...propsCopy};
};

/**
 * Updates your component automatically when the values for a given subject+predicate ValuesSet change
 * @param valuesSet
 */
export const useWatchPropertySet = (...valuesSets:(NodeValuesSet|ShapeValuesSet<any>)[]) => {
  let [bool, setBool,boolRef] = useState<boolean>(false);
  let forceUpdate = useCallback(() => {
    setBool(!boolRef.current);
  },[bool]);
  useEffect(() => {
    valuesSets.forEach(valuesSet => valuesSet.onChange(forceUpdate));
    return () => {
      valuesSets.forEach(valuesSet => valuesSet.removeOnChange(forceUpdate));
    }
  },[]);
}

/**
 * Updates your component automatically when the values of the given property change for the given source
 * If you provide a shape as the source, you can use the property name (the name of the get-method) instead of a NamedNode as the property argument
 * @param source a NamedNode or Shape
 * @param property a NamedNode or a string (the name of the get-method of the Shape)
 */
export function useWatchProperty(source:NamedNode,property:NamedNode);
export function useWatchProperty(source:Shape,property:NamedNode|string);
export function useWatchProperty(source:NamedNode|Shape,property:NamedNode|string) {
  let [bool, setBool,boolRef] = useState<boolean>(false);
  let forceUpdate = useCallback(() => {
    setBool(!boolRef.current);
  },[bool]);
  useEffect(() => {
    if(typeof property === 'string') {
      if(source instanceof Shape) {
        //we want to check all the property shapes of the given shape
        //we could access shape.nodeShape, but we actually also need the propertyShapes of all the shapes in the inheritance chain
        //this we can (currently) do by getting the shapeClass first
        let shapeClass = getShapeClass(source.nodeShape.namedNode);
        //from there we can get the classes it extends
        let shapeClasses = getSuperShapesClasses(shapeClass);
        //we add back the shapeClass itself, as the first shapeClass to check
        shapeClasses.unshift(shapeClass);
        //then for each shape class
        for(let shapeClass of shapeClasses) {
          //we can check if it has a property shape with the given name
          let matchingPropertyShape = shapeClass.shape.getPropertyShapes().find(shape => {
            return shape.label === property
          });
          if(matchingPropertyShape) {
            //TODO: if path can be multiple props, we need to watch the whole path
            property = matchingPropertyShape.path;
            break;
          }
        }
        if(!(property instanceof NamedNode)) {
          throw new Error(`Can't find property ${property} on shape ${source.nodeShape.label}`)
        }
      } else
      {
        throw new Error("Can't use string property with a NamedNode source. Provide a shape + string or NamedNode + NamedNode instead.")
      }
    }
    source.onChange(property as NamedNode,forceUpdate);
    return () => {
      source.removeOnChange(property as NamedNode,forceUpdate);
    }
  },[]);
}
