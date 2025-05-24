import { TTMSSession, TTMSSemester } from "@/types";

/**
 * Validates the given academic session.
 *
 * @param session The academic session to validate.
 * @returns `true` if the session is valid, `false` otherwise.
 */
export function validateAcademicSession(
    session: string
): session is TTMSSession {
    return /^[0-9]{4}\/[0-9]{4}$/.test(session);
}

/**
 * Validates the given semester.
 *
 * @param semester The semester to validate.
 * @returns `true` if the semester is valid, `false` otherwise.
 */
export function validateSemester(semester: number): semester is TTMSSemester {
    return /^(1|2|3)$/.test(semester.toString());
}
