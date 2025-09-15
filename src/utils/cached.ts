import {Shape} from '../shapes/Shape.js';
import {NamedNode} from '../models.js';
const _cache = new Map<string, {timeout: number; value: any}>();

export function cached(fn: () => any, args: any[], cacheTime?: number) {
  if (cacheTime) {
    const now = Date.now();
    args = args.map((a) => {
      if (a instanceof Shape) {
        return a.uri;
      } else if (a instanceof NamedNode) {
        return a.uri;
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
      let value = fn();
      _cache.set(key, {
        timeout: now + cacheTime,
        value,
      });
    }
    return _cache.get(key).value;
  } else {
    return fn();
  }
}
