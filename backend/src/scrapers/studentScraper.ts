import { TTMSService } from "@/api";
import { db } from "@/database";
import { sessions, students } from "@/database/schema";
import { IAPIStudent } from "@/types";
import { sleep } from "@/utils";

const ttmsService = new TTMSService();
const studentsPerFetch = 50;

(async () => {
    // Need to authenticate first
    let auth = await ttmsService.login(
        process.env.SCRAPER_MATRIC_NO!,
        process.env.SCRAPER_PASSWORD!
    );

    if (!auth) {
        console.error("Failed to authenticate");
        return;
    }

    let sessionId = await ttmsService.elevateSession(auth.session_id);

    if (!sessionId) {
        console.error("Failed to elevate session");
        return;
    }

    const savedSessions = await db
        .select({
            sesi: sessions.session,
            semester: sessions.semester,
        })
        .from(sessions);

    for (const session of savedSessions) {
        const { sesi, semester } = session;
        let offset = 0;
        let sessionRefreshAttempts = 0;

        // Sessions before 2007/2008 appear to have no students
        if (
            sesi === "2006/2007" ||
            sesi === "2005/2006" ||
            sesi === "2004/2005"
        ) {
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            await sleep(1000);

            let serverStudents: IAPIStudent[] | null = null;

            try {
                serverStudents = await ttmsService.fetchStudents({
                    sessionId: sessionId!,
                    session: sesi,
                    semester: semester,
                    limit: studentsPerFetch,
                    offset: offset,
                });

                sessionRefreshAttempts = 0;
            } catch (e) {
                console.error(
                    "Failed to fetch students for session",
                    sesi,
                    semester,
                    e
                );

                sessionRefreshAttempts++;

                if (sessionRefreshAttempts >= 3) {
                    console.error("Failed to fetch students after 3 attempts");
                    break;
                }

                auth = await ttmsService.login(
                    process.env.SCRAPER_MATRIC_NO!,
                    process.env.SCRAPER_PASSWORD!
                );

                if (!auth) {
                    console.error("Failed to authenticate");
                    break;
                }

                sessionId = await ttmsService.elevateSession(auth.session_id);

                if (!sessionId) {
                    console.error("Failed to elevate session");
                    break;
                }

                continue;
            }

            if (serverStudents === null) {
                break;
            }

            if (serverStudents.length > 0) {
                await db
                    .insert(students)
                    .ignore()
                    .values(
                        serverStudents.map(
                            (s): typeof students.$inferInsert => ({
                                matricNo: s.no_matrik,
                                name: s.nama,
                                courseCode: s.kod_kursus,
                                facultyCode: s.kod_fakulti,
                                kpNo: s.no_kp,
                            })
                        )
                    );
            }

            console.log(
                "Inserted",
                serverStudents.length,
                "student(s) for session",
                sesi,
                semester,
                "offset",
                offset
            );

            if (serverStudents.length < studentsPerFetch) {
                break;
            }

            offset += studentsPerFetch;
        }
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
