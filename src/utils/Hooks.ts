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
  if (props.className) {
    if (typeof props.className === 'string') {
      classNames = [props.className];
    } else if (Array.isArray(props.className)) {
      classNames = props.className;
    }
  }
  if (props.style) {
    combinedStyles = props.style;
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

  return {className: classNames.filter(Boolean).join(' '), style: combinedStyles};
};
