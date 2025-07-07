import { db } from "@/database";
import { courseSections } from "@/database/schema";
import { sleep } from "@/utils";
import { retrieveCourseSectionSchedules } from "./scrapers";

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
        await retrieveCourseSectionSchedules(courseSection);

        console.log(
            `Current progress: ${(i + 1).toString()}/${savedCourseSections.length.toString()}`
        );
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
