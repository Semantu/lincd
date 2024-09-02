import { EventEmitter } from 'eventemitter3';
import { CoreSet } from '../collections/CoreSet.js';
export interface BatchedEventEmitter {
    emitBatchedEvents(resolve?: any, reject?: any): void;
}
export declare class EventBatcher extends EventEmitter {
    static ALL_EVENTS_DISPATCHED: string;
    emitters: CoreSet<BatchedEventEmitter>;
    private batching;
    private emitting;
    get isBatching(): boolean;
    hasBatchedEvents(filterFn?: (emitter: BatchedEventEmitter) => boolean): boolean;
    getPendingEmitters(filterFn?: (emitter: BatchedEventEmitter) => boolean): CoreSet<BatchedEventEmitter>;
    promiseDone(): Promise<unknown>;
    dispatchBatchedEventsOnceReady(): void;
    dispatchBatchedEvents(): void;
    dispatchSomeEvents(filterEmitters: (emitter: BatchedEventEmitter) => boolean): boolean;
    register(emitter: BatchedEventEmitter): void;
}
export declare const eventBatcher: EventBatcher;
