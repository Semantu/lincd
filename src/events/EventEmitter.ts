/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import {EventEmitter as EventEmitter3} from 'eventemitter3';

var prefix = EventEmitter3['prefixed'];

export class EventEmitter extends EventEmitter3 {
  /**
   * @internal
   * @protected
   */
  protected _events: any;
  /**
   * @internal
   * @protected
   */
  protected _eventsCount: number;

  removeListenerByContext(event: string | symbol, context?: any, once?: boolean): this {
    //copied from source and adjusted
    var evt = prefix && typeof event === 'string' ? prefix + event : event;

    if (!this._events[evt]) return this;
    var listeners = this._events[evt];

    //make a list of events to keep:
    //if a single listener is registered
    let eventsToKeep;

    if (listeners.fn) {
      //check if 'once' and 'context' match
      if ((once && !listeners.fn.once) || (context && listeners.fn.context !== context)) {
        //if not we keep it 'as is'
        eventsToKeep = listeners;
      }
    } else if (listeners) {
      eventsToKeep = [];
      //if there's an array of listeners, go over each
      for (var i = 0, length = listeners.length; i < length; i++) {
        //check if 'once' and 'context' match
        if ((once && !listeners[i].once) || (context && listeners[i].context !== context)) {
          //if not, keep this single listener
          eventsToKeep.push(listeners[i]);
        }
      }
    }

    // update events and events count
    if (eventsToKeep) {
      //take the one event, or, if its an array, take the array, unless theres only one element left, then just use that directly
      this._events[evt] = eventsToKeep.fn ? eventsToKeep : eventsToKeep.length === 1 ? eventsToKeep[0] : eventsToKeep;
    } else {
      --this._eventsCount;
      delete this._events[evt];
    }

    return this;
  }
}
