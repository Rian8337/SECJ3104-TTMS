import {
    TTMSSession,
    TTMSSemester,
    CourseSectionScheduleTime,
    CourseSectionScheduleDay,
} from "@/types";

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

/**
 * Validates whether the given string is a valid matriculation number.
 *
 * @param str The string to validate.
 * @returns `true` if the string is a valid matriculation number, `false` otherwise.
 */
export function isValidMatricNumber(str: unknown): str is string {
    return typeof str === "string" && /^[a-z]{1}\d{2}[a-z]{2}\d{4}$/i.test(str);
}

/**
 * Validates whether the given string is a valid KP number.
 *
 * @param str The string to validate.
 * @returns `true` if the string is a valid KP number, `false` otherwise.
 */
export function isValidKpNo(str: unknown): str is string {
    return typeof str === "string" && str.length === 12;
}

/**
 * Validates whether the given string is a valid worker number.
 *
 * @param str The string to validate.
 * @returns `true` if the string is a valid worker number, `false` otherwise.
 */
export function isValidWorkerNo(str: unknown): str is string {
    return typeof str === "string" && /^[1-9]\d{0,7}$/.test(str);
}

/**
 * Validates whether the given day is a valid timetable day.
 *
 * @param day The day to validate.
 * @returns `true` if the day is valid, `false` otherwise.
 */
export function isValidTimetableDay(
    day: unknown
): day is CourseSectionScheduleDay {
    return typeof day === "number" && day >= 1 && day <= 7;
}

/**
 * Validates whether the given time is a valid timetable time.
 *
 * @param time The time to validate.
 * @returns `true` if the time is valid, `false` otherwise.
 */
export function isValidTimetableTime(
    time: unknown
): time is CourseSectionScheduleTime {
    return typeof time === "number" && time >= 1 && time <= 16;
}
