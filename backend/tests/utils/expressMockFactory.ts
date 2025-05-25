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
    TResponse = Record<string, unknown>,
    TBody = Record<string, unknown>,
    TQuery = Record<string, string>,
>(overrides: Partial<Request<TPath, TResponse, TBody, TQuery>> = {}) {
    return {
        params: {},
        query: {},
        body: {},
        signedCookies: {},
        ...overrides,
    } as unknown as Request<TPath, TResponse, TBody, TQuery>;
}

/**
 * Creates a mock response object for testing with Express.js.
 */
export function createMockResponse<TResponse = unknown>() {
    return {
        cookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response<TResponse>;
}
