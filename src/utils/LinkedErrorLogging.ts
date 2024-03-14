export interface IErrorLogger {
  log?(error: any): Promise<void>;
}

export class LinkedErrorLogging {
  private static logger: IErrorLogger;

  static setDefaultLogger(logger: IErrorLogger) {
    this.logger = logger;
  }

  static hasDefaultLogger() {
    return this.logger && true;
  }

  static log(error: any) {
    if (!this.logger) {
      throw new Error(
        'No error logger set. Make sure the package of your error logger is added to package.json of the application.',
      );
    }

    return this.logger.log(error);
  }
}
