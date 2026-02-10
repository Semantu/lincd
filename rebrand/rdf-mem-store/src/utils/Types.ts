/**
 * A type that represents a class constructor
 */
export type ClassOf<B> = new (...args: any[]) => B;
/**
 * A type that represents an instance of a class (class being a type which is created with ClassOf)
 */
export type InstanceOf<B extends ClassOf<any>> =
  B extends ClassOf<infer C> ? C : never;

export type Not<T extends boolean> = T extends true ? false : true;

export type Or<A, B> = A extends true ? true : B extends true ? true : false;

export type And<A, B> = A extends true
  ? B extends true
    ? true
    : false
  : false;
