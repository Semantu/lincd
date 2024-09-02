"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var eventemitter3_1 = require("eventemitter3");
var prefix = eventemitter3_1.EventEmitter['prefixed'];
var EventEmitter = /** @class */ (function (_super) {
    __extends(EventEmitter, _super);
    function EventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EventEmitter.prototype.emitPromise = function (evt, a1, a2, a3, a4, a5) {
        //BASED ON eventemitter3 implementation of emit
        //But I removed prefix functionality and listeners.fn
        //And then added support for promises
        if (!this._events[evt])
            return Promise.resolve();
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
            listeners = [listeners];
        }
        //ignored listeners.fn
        var length = listeners.length, j;
        var listenerPromises = [];
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
                    listenerPromises.push(listeners[i].fn.call(listeners[i].context, a1, a2));
                    break;
                case 4:
                    listenerPromises.push(listeners[i].fn.call(listeners[i].context, a1, a2, a3));
                    break;
                default:
                    if (!args)
                        for (j = 1, args = new Array(len - 1); j < len; j++) {
                            args[j - 1] = arguments[j];
                        }
                    listenerPromises.push(listeners[i].fn.apply(listeners[i].context, args));
            }
        }
        return Promise.all(listenerPromises).catch(function (err) {
            console.log('Error during emitPromise of event ' +
                evt.toString() +
                ' with args ' +
                JSON.stringify(arguments), err.toString());
        });
    };
    EventEmitter.prototype.removeListenerByContext = function (event, context, once) {
        //copied from source and adjusted
        var evt = prefix && typeof event === 'string' ? prefix + event : event;
        if (!this._events[evt])
            return this;
        var listeners = this._events[evt];
        //make a list of events to keep:
        //if a single listener is registered
        var eventsToKeep;
        if (listeners.fn) {
            //check if 'once' and 'context' match
            if ((once && !listeners.fn.once) ||
                (context && listeners.fn.context !== context)) {
                //if not we keep it 'as is'
                eventsToKeep = listeners;
            }
        }
        else if (listeners) {
            eventsToKeep = [];
            //if there's an array of listeners, go over each
            for (var i = 0, length = listeners.length; i < length; i++) {
                //check if 'once' and 'context' match
                if ((once && !listeners[i].once) ||
                    (context && listeners[i].context !== context)) {
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
        }
        else {
            --this._eventsCount;
            delete this._events[evt];
        }
        return this;
    };
    return EventEmitter;
}(eventemitter3_1.EventEmitter));
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map