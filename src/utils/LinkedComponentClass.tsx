import {Shape} from '../shapes/Shape';
import React from 'react';
import {LinkedComponentProps} from '../interfaces/Component';

// export class LinkedComponentClass<ShapeType extends Shape,P={},S={}> extends React.Component<P & LinkedComponentProps<ShapeType>,S>
// {
//   get sourceShape():ShapeType
//   {
//     let shapeClass = this.constructor['shape'];
//     if(!shapeClass)
//     {
//       throw new Error(`${this.constructor.name} is not linked to a shape`);
//     }
//     return new shapeClass(this.props.source) as ShapeType;
//   }
// }