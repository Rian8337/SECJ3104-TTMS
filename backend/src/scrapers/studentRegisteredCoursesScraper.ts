import { TTMSService } from "@/api";
import { db } from "@/database";
import { studentRegisteredCourses, students } from "@/database/schema";
import { sleep } from "@/utils";

const ttmsService = new TTMSService();

(async () => {
    const savedStudents = await db
        .select({
            matricNo: students.matricNo,
        })
        .from(students);

    for (let i = 0; i < savedStudents.length; i++) {
        await sleep(1000);

        const { matricNo } = savedStudents[i];
        const studentCourses = await ttmsService.fetchStudentCourses(matricNo);

        if (studentCourses === null) {
            console.error("Failed to fetch courses for student", matricNo);
            continue;
        }

        if (studentCourses.length > 0) {
            await db
                .insert(studentRegisteredCourses)
                .ignore()
                .values(
                    studentCourses.map(
                        (c): typeof studentRegisteredCourses.$inferInsert => ({
                            matricNo,
                            courseCode: c.kod_subjek,
                            section: c.seksyen,
                            session: c.sesi,
                            semester: c.semester,
                        })
                    )
                );
        }

        console.log(
            "Inserted",
            studentCourses.length,
            "course(s) for student",
            matricNo,
            `(${(i + 1).toString()}/${savedStudents.length.toString()})`
        );
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
