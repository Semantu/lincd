import {NodeValuesSet} from '../collections/NodeValuesSet';
import {useCallback,useEffect} from 'react';
import useState from 'react-usestateref';
import {ShapeValuesSet} from '../collections/ShapeValuesSet';

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
export const useWatchProperty = (...valuesSets:(NodeValuesSet|ShapeValuesSet<any>)[]) => {
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
