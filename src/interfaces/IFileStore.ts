export interface IFileStore {
  init?(): Promise<any>;

  deleteFile(filePath: string): Promise<void>;

  fileExists(filePath: string): Promise<boolean>;

  getFile(filePath: string): Promise<Buffer | null>;

  listFiles(recursive?: boolean): Promise<string[]>;

  saveFile(filePath: string, fileContent: Buffer): Promise<string | null>;
}
