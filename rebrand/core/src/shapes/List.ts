/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {linkedShape} from '../package.js';
import {Shape} from './Shape.js';
import {linkedProperty, objectProperty} from './SHACL.js';
import {rdf} from '../ontologies/rdf.js';

/**
 * A lightweight list shape for query metadata.
 * This is no longer backed by RDF list quads in core.
 */
@linkedShape
export class List<T = unknown> extends Shape {
  static targetClass = rdf.List;

  @linkedProperty({path: rdf.first, maxCount: 1})
  get first(): T {
    return null;
  }

  @objectProperty({path: rdf.rest, maxCount: 1, shape: List})
  get rest(): List<T> {
    return null;
  }

  private items: T[] = [];

  static fromItems<T>(items: T[]): List<T> {
    const list = new List<T>();
    list.items = [...items];
    return list;
  }

  getContents(): T[] {
    return [...this.items];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  addItem(item: T) {
    this.items.push(item);
  }

  addItems(items: T[]) {
    this.items.push(...items);
  }
}
