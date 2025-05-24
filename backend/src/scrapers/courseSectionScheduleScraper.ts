import { TTMSService } from "@/api";
import { db } from "@/database";
import {
    courseSections,
    courseSectionSchedules,
    venues,
    VenueType,
} from "@/database/schema";
import { sleep } from "@/utils";

const ttmsService = new TTMSService();

(async () => {
    const savedCourseSections = await db
        .select({
            session: courseSections.session,
            semester: courseSections.semester,
            courseCode: courseSections.courseCode,
            section: courseSections.section,
        })
        .from(courseSections);

    for (let i = 0; i < savedCourseSections.length; ++i) {
        const courseSection = savedCourseSections[i];

        await sleep(500);

        const serverSessionCourseTimetables =
            await ttmsService.fetchCourseTimetable(courseSection);

        if (serverSessionCourseTimetables === null) {
            console.error(
                "Failed to fetch course timetables for session",
                courseSection.session,
                courseSection.semester,
                "course code",
                courseSection.courseCode,
                "section",
                courseSection.section,
                `(${(i + 1).toString()}/${savedCourseSections.length.toString()})`
            );

            continue;
        }

        if (serverSessionCourseTimetables.length === 0) {
            console.log(
                "No course section schedules found for session",
                courseSection.session,
                courseSection.semester,
                "course code",
                courseSection.courseCode,
                "section",
                courseSection.section,
                `(${(i + 1).toString()}/${savedCourseSections.length.toString()})`
            );

            continue;
        }

        if (!serverSessionCourseTimetables[0].kod_subjek) {
            console.error(
                "Invalid course section schedule found for session",
                courseSection.session,
                courseSection.semester,
                "course code",
                courseSection.courseCode,
                "section",
                courseSection.section,
                `(${(i + 1).toString()}/${savedCourseSections.length.toString()})`
            );

            continue;
        }

        // Sometimes, the schedule clashes with itself (i.e., 2019/2010 semester 1 SCJ2153 section 8).
        // In that case, we need to remove the duplicate schedules.
        const uniqueSchedules = new Set<string>();

        const filteredServerSessionCourseTimetables =
            serverSessionCourseTimetables.filter((c) => {
                const key = `${c.kod_subjek!}-${c.seksyen!}-${c.hari!.toString()}-${c.masa!.toString()}`;

                if (uniqueSchedules.has(key)) {
                    return false;
                }

                uniqueSchedules.add(key);
                return true;
            });

        const courseSectionSchedulesToInsert = await Promise.all(
            filteredServerSessionCourseTimetables.map(
                async (
                    c
                ): Promise<typeof courseSectionSchedules.$inferInsert> => {
                    // Sometimes the venue is not recorded in upstream database.
                    // In that case, we need to insert the venue.
                    if (c.ruang) {
                        // Ignore duplicate venues.
                        await db.insert(venues).ignore().values({
                            code: c.ruang.kod_ruang,
                            name: c.ruang.nama_ruang,
                            shortName: c.ruang.nama_ruang_singkatan,
                            capacity: 0,
                            type: VenueType.none,
                        });
                    }

                    return {
                        session: courseSection.session,
                        semester: courseSection.semester,
                        courseCode: c.kod_subjek!,
                        section: c.seksyen!,
                        day: c.hari!,
                        time: c.masa!,
                        venueCode: c.ruang?.kod_ruang,
                    };
                }
            )
        );

        await db
            .insert(courseSectionSchedules)
            .values(courseSectionSchedulesToInsert);

        console.log(
            "Inserted",
            serverSessionCourseTimetables.length,
            "course section schedule(s) for session",
            courseSection.session,
            courseSection.semester,
            "course code",
            courseSection.courseCode,
            "section",
            courseSection.section,
            `(${(i + 1).toString()}/${savedCourseSections.length.toString()})`
        );
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
