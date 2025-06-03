import {
    isValidKpNo,
    isValidMatricNumber,
    isValidWorkerNo,
    validateAcademicSession,
    validateSemester,
} from "@/utils";

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

    describe("isValidMatricNumber", () => {
        it("Should validate a valid matriculation number", () => {
            expect(isValidMatricNumber("a12bc3456")).toBe(true);
            expect(isValidMatricNumber("A12BC3456")).toBe(true);
        });

        it("Should invalidate an invalid matriculation number", () => {
            expect(isValidMatricNumber("1234567890")).toBe(false);
            expect(isValidMatricNumber("a12bc34")).toBe(false);
            expect(isValidMatricNumber("a12bc34567")).toBe(false);
            expect(isValidMatricNumber(1234567890)).toBe(false);
        });
    });

    describe("isValidKpNo", () => {
        it("Should validate a valid KP number", () => {
            expect(isValidKpNo("123456789012")).toBe(true);
            expect(isValidKpNo("000000000000")).toBe(true);
        });

        it("Should invalidate an invalid KP number", () => {
            expect(isValidKpNo("12345678901")).toBe(false);
            expect(isValidKpNo("1234567890123")).toBe(false);
            expect(isValidKpNo("12345678900ab")).toBe(false);
            expect(isValidKpNo(123456789012)).toBe(false);
        });
    });

    describe("isValidWorkerNo", () => {
        it("Should validate a valid worker number", () => {
            expect(isValidWorkerNo("12345")).toBe(true);
            expect(isValidWorkerNo("1")).toBe(true);
        });

        it("Should invalidate an invalid worker number", () => {
            expect(isValidWorkerNo("0")).toBe(false);
            expect(isValidWorkerNo("00001")).toBe(false);
            expect(isValidWorkerNo("12345678901234567890")).toBe(false);
            expect(isValidWorkerNo("abcde")).toBe(false);
            expect(isValidWorkerNo(12345)).toBe(false);
        });
    });
});
