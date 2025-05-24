import { TTMSService } from "@/api";
import { db } from "@/database";
import { courseSections, lecturers, sessions } from "@/database/schema";
import { sleep } from "@/utils";
import { eq, or } from "drizzle-orm";

const ttmsService = new TTMSService();

(async () => {
    const savedSessions = await db
        .select({
            sesi: sessions.session,
            semester: sessions.semester,
        })
        .from(sessions);

    for (const session of savedSessions) {
        const { sesi, semester } = session;

        // Sessions before 2006/2007 have no courses
        if (sesi === "2005/2006" || sesi === "2004/2005") {
            continue;
        }

        await sleep(500);

        const serverCourseSections = await ttmsService.fetchCourseSections(
            sesi,
            semester
        );

        if (serverCourseSections === null) {
            console.error(
                "Failed to fetch course sections for session",
                sesi,
                semester
            );

            continue;
        }

        const mappedCourseSections = serverCourseSections.map(
            async (c): Promise<(typeof courseSections.$inferInsert)[]> => {
                if (!c.seksyen_list) {
                    return [];
                }

                const lecturerNames = c.seksyen_list
                    .map((s) => s.pensyarah)
                    .filter((n) => n !== null);

                const sessionLecturers = await db
                    .select()
                    .from(lecturers)
                    .where(
                        or(...lecturerNames.map((n) => eq(lecturers.name, n)))
                    );

                return c.seksyen_list.map(
                    (s): typeof courseSections.$inferInsert => ({
                        session: sesi,
                        semester: semester,
                        courseCode: c.kod_subjek,
                        section: s.seksyen,
                        lecturerNo:
                            s.pensyarah !== null
                                ? sessionLecturers.find(
                                      (l) => l.name === s.pensyarah
                                  )?.workerNo
                                : null,
                    })
                );
            }
        );

        if (mappedCourseSections.length > 0) {
            await db
                .insert(courseSections)
                .ignore()
                .values((await Promise.all(mappedCourseSections)).flat());
        }

        console.log(
            "Inserted",
            serverCourseSections.length,
            "course section(s) for session",
            sesi,
            semester
        );
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
