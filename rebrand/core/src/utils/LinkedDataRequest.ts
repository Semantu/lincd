import {PropertyShape} from '../shapes/SHACL.js';

export type SubRequest = LinkedDataRequest;
/**
 * An array of requested property shapes.
 * If you want to request specific property shapes of another property shape (this is called a SubRequest)
 * then replace a property shape with an array that contains the main property shape as the first element, and an array of property shapes as subRequest of that main property shape
 * e.g.: [shape1,[shape2,[shape3,shape4]]] will request shape 3 & 4 of shape 2
 */
export type LinkedDataRequest = SingleDataRequest[];
export type SingleDataRequest = PropertyShape | [PropertyShape, SubRequest];
