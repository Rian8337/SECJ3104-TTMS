import { IRawTimetable, ITimetable } from "@/types";

/**
 * Converts raw timetables from the database to a structured timetable format.
 *
 * @param rawTimetables The raw timetables to convert.
 * @return An array of structured timetables.
 */
export function convertRawTimetableToTimetable(
    rawTimetables: IRawTimetable[]
): ITimetable[] {
    return rawTimetables.map((t) => ({
        day: t.scheduleDay,
        time: t.scheduleTime,
        courseSection: {
            section: t.section,
            course: {
                code: t.courseCode,
                name: t.courseName,
            },
            lecturer:
                t.lecturerNo !== null && t.lecturerName !== null
                    ? {
                          workerNo: t.lecturerNo,
                          name: t.lecturerName,
                      }
                    : null,
        },
        venue:
            t.venueShortName !== null ? { shortName: t.venueShortName } : null,
    }));
}
