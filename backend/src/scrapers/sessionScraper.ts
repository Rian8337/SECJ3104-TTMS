import { TTMSService } from "@/api";
import { db } from "@/database";
import { sessions } from "@/database/schema";

const ttmsService = new TTMSService();

(async () => {
    const serverSessions = await ttmsService.fetchSessions();

    if (!serverSessions) {
        console.error("Failed to fetch sessions");
        return;
    }

    await db
        .insert(sessions)
        .ignore()
        .values(
            serverSessions.map((s): typeof sessions.$inferInsert => ({
                session: s.sesi,
                semester: s.semester,
                startDate: new Date(s.tarikh_mula),
                endDate: new Date(s.tarikh_tamat),
            }))
        );

    console.log("Inserted", serverSessions.length, "sessions");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
