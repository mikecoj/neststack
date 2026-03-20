/**
 * Recursive type utilities for fully-typed dot-notation path access.
 * Produces union types like "database.url" | "database.poolSize" from nested objects.
 */

type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Recursively marks all properties (and nested properties) as readonly.
 * Accurately reflects the runtime behaviour of `deepFreeze`.
 */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * Converts a union type into an intersection type.
 * Used by `CombineConfigs` to merge per-namespace config maps.
 */
export type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

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
