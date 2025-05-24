import { TTMSService } from "@/api";
import { db } from "@/database";
import { lecturers, sessions } from "@/database/schema";
import { IAPILecturer } from "@/types";
import { sleep } from "@/utils";

const ttmsService = new TTMSService();

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

    let sessionRefreshAttempts = 0;

    for (const session of savedSessions) {
        const { sesi, semester } = session;

        await sleep(500);

        let serverLecturers: IAPILecturer[] | null = null;

        try {
            serverLecturers = await ttmsService.fetchLecturers({
                sessionId: sessionId,
                session: sesi,
                semester: semester,
            });

            sessionRefreshAttempts = 0;
        } catch (e) {
            console.error(
                "Failed to fetch lecturers for session",
                sesi,
                semester,
                e
            );

            sessionRefreshAttempts++;

            if (sessionRefreshAttempts >= 3) {
                console.error("Failed to fetch lecturers after 3 attempts");
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

        if (serverLecturers === null) {
            continue;
        }

        if (serverLecturers.length > 0) {
            await db
                .insert(lecturers)
                .ignore()
                .values(
                    serverLecturers.map((s): typeof lecturers.$inferInsert => ({
                        name: s.nama,
                        workerNo: s.no_pekerja,
                    }))
                );
        }

        console.log(
            "Inserted",
            serverLecturers.length,
            "lecturer(s) for session",
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
