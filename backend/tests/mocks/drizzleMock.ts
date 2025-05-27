import { vi } from "vitest";

/**
 * Mock database functions for testing purposes.
 */
export const mockDb = {
    select: vi.fn(),
    limit: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
} as const;
