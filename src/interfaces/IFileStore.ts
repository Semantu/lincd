export interface IFileStore {
  /**
   * The base URL to access the filestore's files. For example:
   * - http://localhost:4000
   * - https://s3.amazonaws.com/my-bucket
   * - https://my-bucket.nyc3.digitaloceanspaces.com
   */
  // readonly accessURL: string;

  init?(): Promise<any>;

  deleteFile(filePath: string): Promise<void>;

  fileExists(filePath: string): Promise<boolean>;

  getFile(filePath: string): Promise<Buffer | null>;

  listFiles(recursive?: boolean): Promise<string[]>;

  saveFile(filePath: string, fileContent: Buffer): Promise<string | null>;
}
