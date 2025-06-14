import { IRawTimetable, ITimetable, IVenueClashTimetable } from "@/types";

/**
 * Converts raw timetables from the database to a structured timetable format.
 *
 * @param rawTimetables The raw timetables to convert.
 * @returns An array of structured timetables.
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

/**
 * Converts raw venue clash timetables from the database to a structured venue clash timetable format.
 *
 * @param rawTimetables The raw venue clash timetables to convert.
 * @returns An array of structured venue clash timetables.
 */
export function convertRawVenueClashTimetableToVenueClashTimetable(
    rawTimetables: IRawTimetable[]
): IVenueClashTimetable[] {
    const clashes = new Map<string, IVenueClashTimetable>();

    for (const timetable of rawTimetables) {
        const key = `${timetable.scheduleDay.toString()}-${timetable.scheduleTime.toString()}-${timetable.venueShortName!}`;

        if (!clashes.has(key)) {
            clashes.set(key, {
                day: timetable.scheduleDay,
                time: timetable.scheduleTime,
                venue: { shortName: timetable.venueShortName! },
                courseSections: [],
            });
        }

        const clash = clashes.get(key)!;

        clash.courseSections.push({
            section: timetable.section,
            course: {
                code: timetable.courseCode,
                name: timetable.courseName,
            },
            lecturer:
                timetable.lecturerNo !== null && timetable.lecturerName !== null
                    ? {
                          workerNo: timetable.lecturerNo,
                          name: timetable.lecturerName,
                      }
                    : null,
        });
    }

    return Array.from(clashes.values());
}
