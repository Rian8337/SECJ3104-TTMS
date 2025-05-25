import { Request, Response } from "express";
import { vi } from "vitest";

/**
 * Creates a mock request object for testing with Express.js.
 *
 * @param overrides Partial overrides for the request object.
 * @returns A mock request object with default values and the provided overrides.
 */
export function createMockRequest<
    TPath = string,
    TResponse extends Record<string, unknown> = Record<string, unknown>,
    TBody extends Record<string, unknown> = Record<string, unknown>,
    TQuery extends Record<string, string> = Record<string, string>,
>(overrides: Partial<Request<TPath, TResponse, TBody, TQuery>> = {}) {
    type Req = Request<TPath, TResponse, TBody, TQuery>;

    return {
        params: {} as TPath,
        query: {} as TQuery,
        body: {} as TBody,
        signedCookies: {},
        ...overrides,
    } satisfies Partial<Req> as unknown as Req;
}

/**
 * Creates a mock response object for testing with Express.js.
 */
export function createMockResponse<TResponse = unknown>() {
    type Res = Response<TResponse>;

    return {
        cookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        sendStatus: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } satisfies Partial<Res> as unknown as Res;
}
