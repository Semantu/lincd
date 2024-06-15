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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBatcher = exports.EventBatcher = void 0;
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
var next_tick_1 = __importDefault(require("next-tick"));
var eventemitter3_1 = require("eventemitter3");
var CoreSet_js_1 = require("../collections/CoreSet.js");
var EventBatcher = /** @class */ (function (_super) {
    __extends(EventBatcher, _super);
    function EventBatcher() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.emitters = new CoreSet_js_1.CoreSet();
        _this.batching = false;
        return _this;
    }
    Object.defineProperty(EventBatcher.prototype, "isBatching", {
        get: function () {
            return this.batching;
        },
        enumerable: false,
        configurable: true
    });
    EventBatcher.prototype.hasBatchedEvents = function (filterFn) {
        if (filterFn && this.batching) {
            return this.emitters.filter(filterFn).size > 0;
        }
        return this.batching;
    };
    EventBatcher.prototype.getPendingEmitters = function (filterFn) {
        if (filterFn && this.batching) {
            return this.emitters.filter(filterFn);
        }
        return this.emitters;
    };
    EventBatcher.prototype.promiseDone = function () {
        var _this = this;
        if (this.emitters.size == 0) {
            return Promise.resolve(true);
        }
        else {
            return new Promise(function (resolve, reject) {
                _this.once(EventBatcher.ALL_EVENTS_DISPATCHED, function () {
                    resolve(true);
                });
            });
        }
    };
    EventBatcher.prototype.dispatchBatchedEventsOnceReady = function () {
        var _this = this;
        //if we're currently emitting events, then we dont want to do nextTick yet, because those who consume events may want to set nextTick first
        if (this.emitting) {
            //so once all is dispatched, then we dispatch again
            this.once(EventBatcher.ALL_EVENTS_DISPATCHED, function () {
                (0, next_tick_1.default)(_this.dispatchBatchedEvents.bind(_this));
            });
        }
        else {
            //we're already not emitting, so on the next tick we can dispatch events
            (0, next_tick_1.default)(this.dispatchBatchedEvents.bind(this));
        }
    };
    EventBatcher.prototype.dispatchBatchedEvents = function () {
        //reset things before emitting so that new events will be added to new stacks
        var toEmit = this.emitters;
        this.emitters = new CoreSet_js_1.CoreSet();
        this.batching = false;
        this.emitting = true;
        //tell all emitters to dispatch
        toEmit.forEach(function (emitter) {
            emitter.emitBatchedEvents();
        });
        this.emitting = false;
        this.emit(EventBatcher.ALL_EVENTS_DISPATCHED);
    };
    EventBatcher.prototype.dispatchSomeEvents = function (filterEmitters) {
        var _this = this;
        //tell all emitters to dispatch
        this.emitters.forEach(function (emitter) {
            if (filterEmitters(emitter)) {
                emitter.emitBatchedEvents();
                _this.emitters.delete(emitter);
            }
        });
        this.batching = this.emitters.size > 0;
        return this.batching;
    };
    EventBatcher.prototype.register = function (emitter) {
        //first time someone registers an event we will make sure to emit all batched events at the next tick
        if (!this.batching) {
            this.batching = true;
            this.dispatchBatchedEventsOnceReady();
        }
        this.emitters.add(emitter);
    };
    EventBatcher.ALL_EVENTS_DISPATCHED = 'ALL_EVENTS_DISPATCHED';
    return EventBatcher;
}(eventemitter3_1.EventEmitter));
exports.EventBatcher = EventBatcher;
exports.eventBatcher = new EventBatcher();
//# sourceMappingURL=EventBatcher.js.map