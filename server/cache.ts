import memoizee from "memoizee";

const CACHE_TTL = 60000;
const MAX_CACHE_SIZE = 100;

export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: { maxAge?: number; max?: number }
): T {
  return memoizee(fn, {
    promise: true,
    maxAge: options?.maxAge || CACHE_TTL,
    max: options?.max || MAX_CACHE_SIZE,
    preFetch: true,
  }) as T;
}

export function clearAllCaches() {
  cachedFunctions.forEach((fn) => fn.clear?.());
}

const cachedFunctions: any[] = [];

export function registerCachedFunction(fn: any) {
  cachedFunctions.push(fn);
}