/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {Shape} from '../shapes/Shape.js';
import {ShapeSet} from './ShapeSet.js';

export class ShapeValuesSet<S extends Shape = Shape> extends ShapeSet<S> {
  constructor(iterable?: Iterable<S>) {
    super(iterable);
  }
}
