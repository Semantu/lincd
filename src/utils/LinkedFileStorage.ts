import {IFileStore} from '../interfaces/IFileStore';

export abstract class LinkedFileStorage {
  private static defaultStore: IFileStore;

  static getDefaultStore(): IFileStore {
    return this.defaultStore;
  }

  static setDefaultStore(store: IFileStore) {
    this.defaultStore = store;

    if (this.defaultStore.init) {
      this.defaultStore.init();
    }
  }

  static deleteFile(filePath: string): Promise<void> {
    return this.defaultStore.deleteFile(filePath);
  }

  static fileExists(filePath: string): Promise<boolean> {
    return this.defaultStore.fileExists(filePath);
  }

  static getFile(filePath: string): Promise<Buffer> {
    return this.defaultStore.getFile(filePath);
  }

  static listFiles(recursive?: boolean): Promise<string[]> {
    return this.defaultStore.listFiles(recursive);
  }

  static saveFile(filePath: string, fileContent: Buffer): Promise<string> {
    return this.defaultStore.saveFile(filePath, fileContent);
  }
}
