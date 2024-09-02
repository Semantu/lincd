"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asset = exports.LinkedFileStorage = void 0;
var LinkedFileStorage = /** @class */ (function () {
    function LinkedFileStorage() {
    }
    Object.defineProperty(LinkedFileStorage, "accessURL", {
        get: function () {
            // check if default store is not set, return default accessURL
            if (!this.defaultStore) {
                return this.url;
            }
            return this.defaultStore.accessURL;
        },
        enumerable: false,
        configurable: true
    });
    LinkedFileStorage.setDefaultAccessURL = function (accessURL) {
        return (this.url = accessURL);
    };
    LinkedFileStorage.getDefaultStore = function () {
        return this.defaultStore;
    };
    LinkedFileStorage.setDefaultStore = function (store) {
        this.defaultStore = store;
        if (this.defaultStore.init) {
            this.defaultStore.init();
        }
    };
    LinkedFileStorage.deleteFile = function (filePath) {
        return this.defaultStore.deleteFile(filePath);
    };
    LinkedFileStorage.fileExists = function (filePath) {
        return this.defaultStore.fileExists(filePath);
    };
    LinkedFileStorage.getFile = function (filePath) {
        return this.defaultStore.getFile(filePath);
    };
    LinkedFileStorage.listFiles = function (recursive) {
        return this.defaultStore.listFiles(recursive);
    };
    LinkedFileStorage.saveFile = function (filePath, fileContent) {
        return this.defaultStore.saveFile(filePath, fileContent);
    };
    return LinkedFileStorage;
}());
exports.LinkedFileStorage = LinkedFileStorage;
/**
 *  Get the full path of an asset based on the way LinkedFileStorage is configured
 *
 * @param path asset path
 * @param directory asset directory (optional, default is /public)
 * @returns asset url. e.g. https://cdn.example.com/public/image.png
 */
function asset(path, directory) {
    if (directory === void 0) { directory = '/public'; }
    var accessURL = LinkedFileStorage.accessURL;
    var assetUrl = accessURL + directory + path;
    return assetUrl;
}
exports.asset = asset;
//# sourceMappingURL=LinkedFileStorage.js.map