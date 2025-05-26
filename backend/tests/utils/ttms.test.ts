import { describe, expect, it } from "vitest";
import { validateAcademicSession, validateSemester } from "../../src/utils";

describe("TTMS utilities", () => {
    describe("validateAcademicSession", () => {
        it("Should validate a valid academic session", () => {
            expect(validateAcademicSession("2023/2024")).toBe(true);
            expect(validateAcademicSession("2024/2025")).toBe(true);
        });

        it("Should invalidate an invalid academic session", () => {
            expect(validateAcademicSession("2023-2024")).toBe(false);
            expect(validateAcademicSession("2023/24")).toBe(false);
            expect(validateAcademicSession("2023/2024/1")).toBe(false);
            expect(validateAcademicSession("2023/2024a")).toBe(false);
            expect(validateAcademicSession("2023/2024 ")).toBe(false);
        });
    });

    describe("validateSemester", () => {
        it("Should validate a valid semester", () => {
            expect(validateSemester(1)).toBe(true);
            expect(validateSemester(2)).toBe(true);
            expect(validateSemester(3)).toBe(true);
        });

        it("Should invalidate an invalid semester", () => {
            expect(validateSemester(0)).toBe(false);
            expect(validateSemester(4)).toBe(false);
        });
    });
});
