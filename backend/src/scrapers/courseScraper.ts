import { db } from "@/database";
import { sessions } from "@/database/schema";
import { sleep } from "@/utils";
import { retrieveCourses } from "./scrapers";

(async () => {
    const savedSessions = await db
        .select({
            sesi: sessions.session,
            semester: sessions.semester,
        })
        .from(sessions);

    for (const session of savedSessions) {
        await sleep(500);
        await retrieveCourses(session.sesi, session.semester);
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
