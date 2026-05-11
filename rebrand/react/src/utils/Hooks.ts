import React from 'react';

/**
 * Merge className/style props with local style inputs.
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
    } else if (paramType === 'object') {
      if (Array.isArray(classNamesOrStyles)) {
        if (classNames) {
          classNames = classNames.concat(classNamesOrStyles);
        } else {
          classNames = classNamesOrStyles;
        }
      } else {
        combinedStyles = {...props.style, ...(classNamesOrStyles as object)};
      }
    }
    if (styles) {
      combinedStyles = {...combinedStyles, ...styles};
    }
  }

  return {
    className: (classNames || []).filter(Boolean).join(' '),
    style: combinedStyles,
    ...propsCopy,
  };
};
