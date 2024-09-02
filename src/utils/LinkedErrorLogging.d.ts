export interface IErrorLogger {
    log?(error: any): Promise<void>;
}
/**
 * Utility class to log errors.
 * Install any error client package like lincd-sentry in your app to log errors.
 */
export declare class LinkedErrorLogging {
    private static logger;
    static setDefaultLogger(logger: IErrorLogger): void;
    static hasDefaultLogger(): boolean;
    static log(error: Error): Promise<void>;
}
