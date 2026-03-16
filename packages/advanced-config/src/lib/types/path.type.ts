/**
 * Recursive type utilities for fully-typed dot-notation path access.
 * Produces union types like "database.url" | "database.poolSize" from nested objects.
 */

type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Path<T, Depth extends number[] = []> = Depth['length'] extends 5
  ? never
  : T extends Primitive
    ? never
    : T extends Array<unknown>
      ? never
      : {
          [K in keyof T & string]: T[K] extends Primitive | Array<unknown>
            ? K
            : T[K] extends Record<string, unknown>
              ? K | `${K}.${Path<T[K], [...Depth, 0]>}`
              : K;
        }[keyof T & string];

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
