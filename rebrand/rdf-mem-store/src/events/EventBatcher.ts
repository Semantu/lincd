/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import nextTick from 'next-tick';
import {EventEmitter} from 'eventemitter3';
import {CoreSet} from '@_linked/core/collections/CoreSet';


export interface BatchedEventEmitter {
  emitBatchedEvents(resolve?: any, reject?: any): void;
}

export class EventBatcher extends EventEmitter {
  static ALL_EVENTS_DISPATCHED: string = 'ALL_EVENTS_DISPATCHED';
  emitters: CoreSet<BatchedEventEmitter> = new CoreSet<BatchedEventEmitter>();
  private batching: boolean = false;
  private emitting: boolean;

  get isBatching() {
    return this.batching;
  }

  hasBatchedEvents(
    filterFn?: (emitter: BatchedEventEmitter) => boolean,
  ): boolean {
    if (filterFn && this.batching) {
      return this.emitters.filter(filterFn).size > 0;
    }
    return this.batching;
  }

  getPendingEmitters(
    filterFn?: (emitter: BatchedEventEmitter) => boolean,
  ): CoreSet<BatchedEventEmitter> {
    if (filterFn && this.batching) {
      return this.emitters.filter(filterFn);
    }
    return this.emitters;
  }

  promiseDone() {
    if (this.emitters.size == 0) {
      return Promise.resolve(true);
    } else {
      return new Promise((resolve, reject) => {
        this.once(EventBatcher.ALL_EVENTS_DISPATCHED, () => {
          resolve(true);
        });
      });
    }
  }

  dispatchBatchedEventsOnceReady() {
    //if we're currently emitting events, then we dont want to do nextTick yet, because those who consume events may want to set nextTick first
    if (this.emitting) {
      //so once all is dispatched, then we dispatch again
      this.once(EventBatcher.ALL_EVENTS_DISPATCHED, () => {
        nextTick(this.dispatchBatchedEvents.bind(this));
      });
    } else {
      //we're already not emitting, so on the next tick we can dispatch events
      nextTick(this.dispatchBatchedEvents.bind(this));
    }
  }

  dispatchBatchedEvents() {
    //reset things before emitting so that new events will be added to new stacks
    var toEmit = this.emitters;
    this.emitters = new CoreSet();
    this.batching = false;
    this.emitting = true;

    //tell all emitters to dispatch
    toEmit.forEach((emitter) => {
      emitter.emitBatchedEvents();
    });
    this.emitting = false;
    this.emit(EventBatcher.ALL_EVENTS_DISPATCHED);
  }

  dispatchSomeEvents(
    filterEmitters: (emitter: BatchedEventEmitter) => boolean,
  ) {
    //tell all emitters to dispatch
    this.emitters.forEach((emitter) => {
      if (filterEmitters(emitter)) {
        emitter.emitBatchedEvents();
        this.emitters.delete(emitter);
      }
    });
    this.batching = this.emitters.size > 0;
    return this.batching;
  }

  register(emitter: BatchedEventEmitter) {
    //first time someone registers an event we will make sure to emit all batched events at the next tick
    if (!this.batching) {
      this.batching = true;
      this.dispatchBatchedEventsOnceReady();
    }
    this.emitters.add(emitter);
  }
}

export const eventBatcher = new EventBatcher();
