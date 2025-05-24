/**
 * Sleeps for a given number of milliseconds.
 *
 * @param ms The number of milliseconds to sleep for.
 */
export function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
