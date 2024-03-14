export interface IErrorLogger {
  log?(error: any): Promise<void>;
}

/**
 * Utility class to log errors.
 * Install any error client package like lincd-sentry in your app to log errors.
 */
export class LinkedErrorLogging {
  private static logger: IErrorLogger;

  static setDefaultLogger(logger: IErrorLogger) {
    this.logger = logger;
  }

  static hasDefaultLogger() {
    return this.logger && true;
  }

  static log(error: Error) {
    if (this.logger) {
      return this.logger.log(error);
    }
  }
}
