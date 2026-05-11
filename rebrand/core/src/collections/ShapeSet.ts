/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {CoreSet} from './CoreSet.js';
import {Shape} from '../shapes/Shape.js';
import {getLeastSpecificShapeClasses} from '../utils/ShapeClass.js';

export class ShapeSet<R extends Shape = Shape> extends CoreSet<R> {
  constructor(iterable?: Iterable<R>) {
    super(iterable);
  }

  getLeastSpecificShape() {
    return getLeastSpecificShapeClasses(this).shift();
  }
}
