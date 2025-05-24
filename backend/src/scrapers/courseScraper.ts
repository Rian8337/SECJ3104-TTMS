import { TTMSService } from "@/api";
import { db } from "@/database";
import { courses, sessions } from "@/database/schema";
import { sleep } from "@/utils";

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

        await sleep(500);

        // Sessions before 2006/2007 have no courses
        if (sesi === "2005/2006" || sesi === "2004/2005") {
            continue;
        }

        const serverCourses = await ttmsService.fetchCourses(sesi, semester);

        if (!serverCourses) {
            console.error(
                "Failed to fetch courses for session",
                sesi,
                semester
            );

            continue;
        }

        await db
            .insert(courses)
            .ignore()
            .values(
                serverCourses.map((c): typeof courses.$inferInsert => ({
                    code: c.kod_subjek,
                    name: c.nama_subjek,
                    credits: parseInt(c.kod_subjek.split("").at(-1)!) || 0,
                }))
            );

        console.log(
            "Inserted",
            serverCourses.length,
            "courses for session",
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
