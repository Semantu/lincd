"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedErrorLogging = void 0;
/**
 * Utility class to log errors.
 * Install any error client package like lincd-sentry in your app to log errors.
 */
var LinkedErrorLogging = /** @class */ (function () {
    function LinkedErrorLogging() {
    }
    LinkedErrorLogging.setDefaultLogger = function (logger) {
        this.logger = logger;
    };
    LinkedErrorLogging.hasDefaultLogger = function () {
        return this.logger && true;
    };
    LinkedErrorLogging.log = function (error) {
        if (this.logger) {
            return this.logger.log(error);
        }
    };
    return LinkedErrorLogging;
}());
exports.LinkedErrorLogging = LinkedErrorLogging;
//# sourceMappingURL=LinkedErrorLogging.js.map