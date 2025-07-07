import { db } from "@/database";
import { sessions } from "@/database/schema";
import { retrieveStudents } from "./scrapers";

(async () => {
    const savedSessions = await db
        .select({
            sesi: sessions.session,
            semester: sessions.semester,
        })
        .from(sessions);

    for (const session of savedSessions) {
        await retrieveStudents(session.sesi, session.semester);
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
