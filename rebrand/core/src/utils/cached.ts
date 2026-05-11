import {Shape} from '../shapes/Shape.js';

const _cache = new Map<string, {timeout: number; value: any}>();

/**
 * Caches the result of a function call based on its arguments for a specified time.
 * Arguments are converted to strings for comparison.
 * Use cacheTimeMs = 0 to disable caching.
 * Use cacheTimeMs = Infinity to never expire the cache.
 * @param fn
 * @param args
 * @param cacheTimeMs
 * @param alsoCacheErrors
 */
export function cached(fn: () => any, args: any[], cacheTimeMs?: number,alsoCacheErrors?: boolean) {
  if (cacheTimeMs !== 0) {
    const now = Date.now();
    args = args.map((a) => {
      if (a instanceof Shape) {
        return a.id ?? a.uri;
      } else if (a && typeof a === 'object' && 'id' in a) {
        return (a as {id: string}).id;
      } else {
        return a?.toString();
      }
    });
    let key = JSON.stringify(args);
    let cache = _cache.get(key);
    if (cache && cache.timeout < now) {
      _cache.delete(key);
      cache = null;
    }
    if (!cache) {
      let value;
      try {
        value = fn();
      } catch(e) {
        if(alsoCacheErrors) {
          value = e;
        } else {
          throw e;
        }
      }
      _cache.set(key, {
        timeout: now + cacheTimeMs,
        value,
      });
    }
    return _cache.get(key).value;
  } else {
    return fn();
  }
}
