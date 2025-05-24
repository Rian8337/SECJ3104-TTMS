import { Response } from "express";
import { vi } from "vitest";

/**
 * Creates a mock response object for testing with Express.js.
 */
export function createMockResponse() {
    return {
        cookie: vi.fn().mockReturnThis(),
        clearCookie: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
}
