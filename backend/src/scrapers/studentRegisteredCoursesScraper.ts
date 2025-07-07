import { db } from "@/database";
import { students } from "@/database/schema";
import { sleep } from "@/utils";
import { retrieveStudentRegisteredCourses } from "./scrapers";

(async () => {
    const savedStudents = await db
        .select({ matricNo: students.matricNo })
        .from(students);

    for (let i = 0; i < savedStudents.length; i++) {
        await sleep(1000);
        await retrieveStudentRegisteredCourses(savedStudents[i].matricNo);

        console.log(
            `Current progress: (${(i + 1).toString()}/${savedStudents.length.toString()})`
        );
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
