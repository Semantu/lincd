import {IFileStore} from '../interfaces/IFileStore';

export abstract class FileStorage {
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
}
