import { TTMSService } from "@/api";
import { db } from "@/database";
import { studentRegisteredCourses, students } from "@/database/schema";
import { IAPICourseSectionStudent } from "@/types";
import { eq } from "drizzle-orm";

// Background: the regular student API does not return the no_kp for students.
// As such, we need to use other means to get the no_kp for students.

const ttmsService = new TTMSService();
const noKpMap = new Map<string, string>();

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

    const studentsWithoutNoKp = await db
        .select({
            name: students.name,
            matricNo: students.matricNo,
        })
        .from(students)
        .where(eq(students.kpNo, "-"));

    let sessionRefreshAttempts = 0;

    for (let i = 0; i < studentsWithoutNoKp.length; ++i) {
        const student = studentsWithoutNoKp[i];

        if (noKpMap.has(student.name)) {
            const noKp = noKpMap.get(student.name)!;

            await db
                .update(students)
                .set({ kpNo: noKp })
                .where(eq(students.name, student.name));

            console.log(
                "Updated student",
                student.name,
                "with no kp",
                noKp,
                `(${(i + 1).toString()}/${studentsWithoutNoKp.length.toString()})`
            );

            continue;
        }

        const studentCourses = await db
            .select({
                courseCode: studentRegisteredCourses.courseCode,
                section: studentRegisteredCourses.section,
                session: studentRegisteredCourses.session,
                semester: studentRegisteredCourses.semester,
            })
            .from(studentRegisteredCourses)
            .where(eq(studentRegisteredCourses.matricNo, student.matricNo))
            .limit(1);

        if (studentCourses.length === 0) {
            console.error(
                "No courses found for student",
                student.name,
                `(${(i + 1).toString()}/${studentsWithoutNoKp.length.toString()})`
            );

            continue;
        }

        const studentCourse = studentCourses[0];
        let studentsInSection: IAPICourseSectionStudent[] | null = null;

        try {
            studentsInSection = await ttmsService.fetchStudentsInSection({
                sessionId: sessionId,
                session: studentCourse.session,
                semester: studentCourse.semester,
                courseCode: studentCourse.courseCode,
                section: studentCourse.section,
            });

            sessionRefreshAttempts = 0;
        } catch (e) {
            console.error(
                "Failed to fetch students in section for session",
                studentCourse.session,
                studentCourse.semester,
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

        if (studentsInSection === null) {
            console.error(
                "No students found in section for student",
                student.name,
                `(${(i + 1).toString()}/${studentsWithoutNoKp.length.toString()})`
            );

            continue;
        }

        const studentInSection = studentsInSection.find(
            (s) => s.nama === student.name
        );

        if (studentInSection) {
            await db
                .update(students)
                .set({ kpNo: studentInSection.no_kp })
                .where(eq(students.name, studentInSection.nama));

            console.log(
                "Updated student",
                studentInSection.nama,
                "with no kp",
                studentInSection.no_kp,
                `(${(i + 1).toString()}/${studentsWithoutNoKp.length.toString()})`
            );
        } else {
            console.error(
                "No student found in section for student",
                student.name,
                `(${(i + 1).toString()}/${studentsWithoutNoKp.length.toString()})`
            );
        }

        for (const studentInSection of studentsInSection) {
            // Sometimes the API returns an empty name or no_kp
            if (studentInSection.nama && studentInSection.no_kp) {
                noKpMap.set(studentInSection.nama, studentInSection.no_kp);
            }
        }
    }

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
