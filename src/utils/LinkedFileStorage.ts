import {IFileStore} from '../interfaces/IFileStore.js';
import type {Readable} from 'stream';

export abstract class LinkedFileStorage {
  private static defaultStore: IFileStore;
  private static url: string; // default accessURL

  static get accessURL(): string {
    // check if default store is not set, return default accessURL
    if (!this.defaultStore) {
      return this.url;
    }

    return this.defaultStore.accessURL;
  }

  static setDefaultAccessURL(accessURL: string): string {
    return (this.url = accessURL);
  }

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

  static listFiles(prefix?: string): Promise<string[]> {
    return this.defaultStore.listFiles(prefix);
  }

  static saveFile(
    filePath: string,
    fileContent: string | Uint8Array | Buffer | Readable,
    mimeType?: string,
    preventDuplicates: boolean = false,
  ): Promise<string> {
    return this.defaultStore.saveFile(
      filePath,
      fileContent,
      mimeType,
      preventDuplicates,
    );
  }
}

const trimTrailingSlash = (value: string = '') => value.replace(/\/+$/g, '');
const trimSlashes = (value: string = '') => value.replace(/^\/+|\/+$/g, '');

/**
 * Safe env access for both browser and server bundles.
 * In browser builds, direct process access can throw when not polyfilled.
 */
const readEnv = (getter: () => string | undefined) => {
  try {
    return getter();
  } catch (_error) {
    return undefined;
  }
};

/**
 * Append a path segment exactly once, normalizing slashes.
 * Example: ("https://cdn.example.com", "4.1.2") -> "https://cdn.example.com/4.1.2"
 */
const appendPathSegment = (base?: string, segment?: string) => {
  const cleanBase = trimTrailingSlash(base || '');
  const cleanSegment = trimSlashes(segment || '');
  if (!cleanBase) {
    return undefined;
  }
  if (!cleanSegment || cleanBase.endsWith(`/${cleanSegment}`)) {
    return cleanBase;
  }
  return `${cleanBase}/${cleanSegment}`;
};

const getStaticAccessURLFromEnv = () => {
  // 1) Use explicit static base if provided by storage bootstrap.
  // 2) Otherwise derive static base from shared CDN + VERSION.
  const staticAccessURL = readEnv(() => process.env.STATIC_ACCESS_URL);
  const sharedAccessURL = readEnv(() => process.env.S3_CDN_URL);
  const version = readEnv(() => process.env.VERSION);

  if (staticAccessURL) {
    return trimTrailingSlash(staticAccessURL);
  }

  return appendPathSegment(sharedAccessURL, version);
};

/**
 * Get the full path of an asset based on the way LinkedFileStorage is configured
 * Returns accessURL + directory (/public by default) + path
 * - Absolute URLs (http/https/data/blob) are returned unchanged
 * - `/public/...` inputs are normalized to avoid `/public/public/...`
 * @param path asset path
 * @param directory asset directory (optional, default is /public)
 * @returns asset url. e.g. https://cdn.example.com/public/image.png
 */
export function asset(path: string, directory: string = '/public'): string {
  if (!path) {
    return path;
  }

  if (/^(?:https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) {
    return path;
  }

  // Prefer static env-derived URL for deterministic bundle/image hosting.
  // Fallback to default LinkedFileStorage URL for backward compatibility.
  const accessURL =
    getStaticAccessURLFromEnv() ||
    trimTrailingSlash(LinkedFileStorage.accessURL || '');
  const normalizedDirectory = directory.endsWith('/')
    ? directory.slice(0, -1)
    : directory;
  const normalizedPath = path.startsWith('/public/')
    ? path.replace(/^\/public/, '')
    : path.startsWith('/')
      ? path
      : `/${path}`;

  return accessURL + normalizedDirectory + normalizedPath;
}
