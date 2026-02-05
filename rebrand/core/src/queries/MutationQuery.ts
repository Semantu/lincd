import {
  LiteralUpdateValue,
  NodeDescriptionValue,
  NodeReferenceValue,
  PropUpdateValue,
  QueryFactory,
  SetModification,
  SetModificationValue,
  SinglePropertyUpdateValue,
  UpdateNodePropertyValue,
  UpdatePartial,
} from './QueryFactory.js';
import {NodeShape, PropertyShape} from '../shapes/SHACL.js';
import {Shape} from '../shapes/Shape.js';
import {getShapeClass} from '../utils/ShapeClass.js';

export type NodeId = {id: string} | string;

export class MutationQueryFactory extends QueryFactory {
  protected convertUpdateObject(
    obj,
    shape: NodeShape,
    allowTopLevelId: boolean = false,
  ): NodeDescriptionValue {
    if (typeof obj === 'object' && !(obj instanceof Date) && obj !== null) {
      if (!allowTopLevelId && 'id' in obj) {
        throw new Error(
          'You cannot use id in the top level of an update object',
        );
      }
      return this.convertNodeDescription(obj, shape);
    } else if (typeof obj === 'function') {
      //TODO
      throw new Error('Update functions are not implemented yet');
    } else {
      throw new Error('Invalid update object');
    }
  }

  protected isSetModification(obj, shape) {
    // return obj.add || obj.remove;
    let hasAdd = obj.add;
    let hasRemove = obj.remove;
    let numKeysExpected = (hasAdd ? 1 : 0) + (hasRemove ? 1 : 0);
    let numKeys = Object.getOwnPropertyNames(obj).length;
    return hasAdd || (hasRemove && numKeysExpected === numKeys);
  }

  protected convertSetModification(
    obj: SetModification<any>,
    shape: PropertyShape,
  ): SetModificationValue {
    if (!obj.add && !obj.remove) {
      throw new Error('Set modification should have either add or remove key');
    }
    const res: SetModificationValue = {};
    if (obj.add) {
      res.$add = this.convertSetAddValue(obj.add, shape);
    }
    if (obj.remove) {
      res.$remove = this.convertSetRemoveValue(obj.remove, shape);
    }
    return res;
  }

  protected convertSetRemoveValue(
    obj: UpdatePartial | UpdatePartial[],
    shape: PropertyShape,
  ): NodeReferenceValue[] {
    //the user can either pass an array of node references or a single node reference
    //either way we should return an array of node reference values
    if (Array.isArray(obj)) {
      return obj.map((o) => this.convertSingleRemoveValue(o, shape));
    } else {
      return [this.convertSingleRemoveValue(obj, shape)];
    }
  }

  protected convertSetAddValue(
    obj: UpdatePartial | UpdatePartial[],
    shape: PropertyShape,
  ): UpdatePartial[] {
    if (Array.isArray(obj)) {
      return obj.map((o) => this.convertUpdateValue(o, shape) as UpdatePartial);
    } else {
      return [this.convertUpdateValue(obj, shape) as UpdatePartial];
    }
  }

  protected convertSingleRemoveValue(
    value,
    shape: PropertyShape,
  ): NodeReferenceValue {
    if (this.isNodeReference(value)) {
      return this.convertNodeReference(value);
    } else {
      throw new Error(
        `Invalid value for ${shape.label}.$remove. Expected an object with an id as key: {id:string}`,
      );
    }
  }

  protected convertNodeDescription(
    obj: Object,
    shape: NodeShape,
  ): NodeDescriptionValue {
    const props = shape.getPropertyShapes(true);
    const fields: UpdateNodePropertyValue[] = [];
    let id;
    if (obj && '__id' in obj) {
      //if the object has a __id key, then we should use that in the result
      id = obj.__id.toString();
      //but we should not include it in the fields
      delete obj.__id;
    }
    for (var key in obj) {
      let propShape = props.find((p) => p.label === key);
      if (!propShape) {
        throw Error(
          `Invalid property key: ${key}. The shape ${shape.label || shape.id.split('/').pop()} does not have a registered property with this name. Make sure the get/set method exists, and that it uses a @objectProperty or @literalProperty decorator.`,
        );
      } else {
        fields.push(this.createNodePropertyValue(obj[key], propShape));
      }
    }
    const res: NodeDescriptionValue = {
      fields,
      shape,
    };
    if (id) {
      res.__id = id;
    }

    return res;
  }

  protected createNodePropertyValue(
    value,
    propShape: PropertyShape,
  ): UpdateNodePropertyValue {
    // let value = obj[propShape.label];
    return {
      prop: propShape,
      val: this.convertUpdateValue(value, propShape),
    } as UpdateNodePropertyValue;
  }

  protected convertUpdateValue(
    value,
    propShape?: PropertyShape,
    allowArrays: boolean = true,
  ): PropUpdateValue {
    //single value which will
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      return value as LiteralUpdateValue;
    }

    //if multiple items are given as value of this prop
    if (Array.isArray(value)) {
      if (!allowArrays) {
        throw new Error('Nested arrays are not allowed as values of keys');
      }
      //then convert each value, but disallow nested arrays moving forward
      return value.map((o) => {
        return this.convertUpdateValue(o, propShape, false);
      }) as SinglePropertyUpdateValue[];
    } else if (typeof value === 'undefined') {
      return value;
    } else if (value === null) {
      //unsetting a value with null is also possible. But we pass it as undefined in the query object
      return undefined;
    } else if (typeof value === 'object') {
      if (this.isNodeReference(value)) {
        return this.convertNodeReference(value);
      } else {
        let valueShape: NodeShape = null;
        if (propShape.valueShape) {
          const shapeClass = getShapeClass(propShape.valueShape);
          valueShape = shapeClass?.shape || null;
          if (!valueShape) {
            throw new Error(
              `Shape class not found for ${propShape.valueShape.id}`,
            );
          }
        }
        //pass the value shape of the property as the node shape of this value
        if (!propShape.valueShape) {
          //It's possible to define the shape of the value in the value itself for properties who do not define the shape in their objectProperty
          if (value.shape) {
            if (!(value.shape.shape instanceof NodeShape)) {
              throw new Error(
                `The value of property "shape" is invalid and should be a class that extends Shape.`,
              );
            }
            valueShape = (value.shape as typeof Shape).shape;
          } else {
            //TODO: not sure if this should be an error. Does every @linkedObject need to define the shape of the values?
            // If not, then how do we continue? because currently we use the value shape to look up further property shapes
            throw new Error(
              `Cannot update properties with plain objects if the shape of the values is not known. Make sure get/set ${propShape.parentNodeShape.label}.${propShape.label} defines the 'shape' key in its @objectProperty decorator.`,
            );
          }
        }
        //never keep a shape key in the value object
        if (value.shape) {
          //double check that IF a shape value is provided, that it matches the shape from the @objectProperty decorator
          if ((value.shape as typeof Shape).shape.id !== valueShape.id) {
            throw new Error(
              `The property 'shape' is reserved in LINCD and should not be used here in this way. The ${propShape.label} property already defines the shape of the value as ${propShape.label}. If you want to use a different shape, use the 'shape' key in the @objectProperty decorator.`,
            );
          }
          delete value.shape;
        }

        if (this.isSetModification(value, propShape)) {
          return this.convertSetModification(value, propShape);
        } else {
          return this.convertNodeDescription(value, valueShape);
        }
        // //check if the property shape allows a single value
        // if(propShape.maxCount === 1) {
        //   //if yes, then the object should be seen as a node description
        //   return this.convertNodeDescription(value,propShape.valueShape);
        // } else {
        //   if(this.isSetModification(value,propShape)) {
        //     //but if multiple values are allowed, the value should either be an Array of node descriptions
        //     //OR an object with add or remove keys
        //     return this.convertSetModification(value,propShape);
        //   } else {
        //     //it must be a set overwrite, and it must be coming from an array
        //     if(!allowArrays) {
        //       return this.convertNodeDescription(value,propShape.valueShape);
        //     } else {
        //       throw new Error("Invalid array value. Should be a node reference or node description")
        //     }
        //   }
        // }
      }
    }
    throw new Error(`Unsupported update value type: ${typeof value}`);
  }

  protected isNodeReference(obj): obj is NodeReferenceValue {
    //check if obj is an object with an id property
    //if yes, all other properties are ignored
    return typeof obj === 'object' && obj !== null && 'id' in obj; // && Object.keys(obj).length === 1);
    //and id is the only property
  }

  protected convertNodeReferences(
    input: NodeId[] | NodeId,
  ): NodeReferenceValue[] {
    if (Array.isArray(input)) {
      return input.map((o) => {
        return this.convertNodeReferenceOrString(o);
      });
    } else {
      return [this.convertNodeReferenceOrString(input)];
    }
  }

  protected convertNodeReferenceOrString(
    o: {id: string} | string,
  ): NodeReferenceValue {
    if (typeof o === 'string') {
      return {id: o};
    } else if (this.isNodeReference(o)) {
      return this.convertNodeReference(o);
    } else {
      throw new Error(`Invalid node reference: ${JSON.stringify(o)}`);
    }
  }

  protected convertNodeReference(obj: {id: string}): NodeReferenceValue {
    //ensure there are no other properties in the object
    // if (Object.keys(obj).length > 1)
    // {
    //   throw new Error('Cannot have id and other properties in the same value object');
    // }
    return {id: obj.id};
  }
}
