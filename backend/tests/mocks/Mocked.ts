import { Mock } from "vitest";

/**
 * Utility type to create a mock of a given type T.
 *
 * This is used instead of vitest's `Mocked<T>` to allow individual
 * tests to work around generic type issues.
 */
export type Mocked<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]: T[P] extends (...args: any[]) => any
        ? Mock<T[P]>
        : T[P] extends object
          ? Mocked<T[P]>
          : T[P];
};
