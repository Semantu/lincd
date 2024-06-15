import { EventEmitter as EventEmitter3 } from 'eventemitter3';
export declare class EventEmitter extends EventEmitter3 {
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
    emitPromise(evt: string | symbol, a1?: any, a2?: any, a3?: any, a4?: any, a5?: any): Promise<any>;
    removeListenerByContext(event: string | symbol, context?: any, once?: boolean): this;
}
