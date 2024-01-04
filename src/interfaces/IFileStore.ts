export interface IFileStore {
  init?(): Promise<any>;

  saveFile(filePath: string, fileContent: Buffer): Promise<string | null>;

  getFile(filePath: string): Promise<Buffer | null>;

  deleteFile(filePath: string): Promise<void>;

  fileExists(filePath: string): Promise<boolean>;
}
