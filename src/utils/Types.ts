/**
 * A type that represents a class constructor
 */
export type ClassOf<B> = new (...args: any[]) => B
/**
 * A type that represents an instance of a class (class being a type which is created with ClassOf)
 */
export type InstanceOf<B extends ClassOf<any>> = B extends ClassOf<infer C> ? C : never;


