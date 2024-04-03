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

  emitPromise(evt: string | symbol, a1?, a2?, a3?, a4?, a5?): Promise<any> {
    //BASED ON eventemitter3 implementation of emit
    //But I removed prefix functionality and listeners.fn
    //And then added support for promises

    if (!this._events[evt]) return Promise.resolve();

    var listeners = this._events[evt],
      len = arguments.length,
      args,
      i;

    if (listeners.fn) {
      listeners = [listeners];
    }
    //ignored listeners.fn
    var length = listeners.length,
      j;

    let listenerPromises = [];
    for (i = 0; i < length; i++) {
      if (listeners[i].once)
        this.removeListener(evt, listeners[i].fn, undefined, true);

      switch (len) {
        case 1:
          listenerPromises.push(listeners[i].fn.call(listeners[i].context));
          break;
        case 2:
          listenerPromises.push(listeners[i].fn.call(listeners[i].context, a1));
          break;
        case 3:
          listenerPromises.push(
            listeners[i].fn.call(listeners[i].context, a1, a2),
          );
          break;
        case 4:
          listenerPromises.push(
            listeners[i].fn.call(listeners[i].context, a1, a2, a3),
          );
          break;
        default:
          if (!args)
            for (j = 1, args = new Array(len - 1); j < len; j++) {
              args[j - 1] = arguments[j];
            }

          listenerPromises.push(
            listeners[i].fn.apply(listeners[i].context, args),
          );
      }
    }
    return Promise.all(listenerPromises).catch(function (err) {
      console.log(
        'Error during emitPromise of event ' +
          evt.toString() +
          ' with args ' +
          JSON.stringify(arguments),
        err.toString(),
      );
    });
  }

  removeListenerByContext(
    event: string | symbol,
    context?: any,
    once?: boolean,
  ): this {
    //copied from source and adjusted
    var evt = prefix && typeof event === 'string' ? prefix + event : event;

    if (!this._events[evt]) return this;
    var listeners = this._events[evt];

    //make a list of events to keep:
    //if a single listener is registered
    let eventsToKeep;

    if (listeners.fn) {
      //check if 'once' and 'context' match
      if (
        (once && !listeners.fn.once) ||
        (context && listeners.fn.context !== context)
      ) {
        //if not we keep it 'as is'
        eventsToKeep = listeners;
      }
    } else if (listeners) {
      eventsToKeep = [];
      //if there's an array of listeners, go over each
      for (var i = 0, length = listeners.length; i < length; i++) {
        //check if 'once' and 'context' match
        if (
          (once && !listeners[i].once) ||
          (context && listeners[i].context !== context)
        ) {
          //if not, keep this single listener
          eventsToKeep.push(listeners[i]);
        }
      }
    }

    // update events and events count
    if (eventsToKeep) {
      //take the one event, or, if its an array, take the array, unless theres only one element left, then just use that directly
      this._events[evt] = eventsToKeep.fn
        ? eventsToKeep
        : eventsToKeep.length === 1
          ? eventsToKeep[0]
          : eventsToKeep;
    } else {
      --this._eventsCount;
      delete this._events[evt];
    }

    return this;
  }
}
