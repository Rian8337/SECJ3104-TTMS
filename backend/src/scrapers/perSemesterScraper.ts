import { TTMSService } from "@/api";
import { db } from "@/database";
import { courseSections, sessions, students } from "@/database/schema";
import { sleep, validateAcademicSession, validateSemester } from "@/utils";
import {
    retrieveCourses,
    retrieveCourseSections,
    retrieveCourseSectionSchedules,
    retrieveLecturers,
    retrieveStudentKpNo,
    retrieveStudentRegisteredCourses,
    retrieveStudents,
} from "./scrapers";
import { and, eq } from "drizzle-orm";

const ttmsService = new TTMSService();

(async () => {
    const sessionInput = process.argv.find((arg) =>
        arg.startsWith("--session=")
    );

    const semesterInput = process.argv.find((arg) =>
        arg.startsWith("--semester=")
    );

    if (!sessionInput || !semesterInput) {
        console.error("Please provide --session and --semester arguments");
        return;
    }

    const session = sessionInput.split("=")[1];
    const semester = parseInt(semesterInput.split("=")[1]);

    if (!validateAcademicSession(session)) {
        console.error("Invalid session format. Expected format: YYYY/YYYY");
        return;
    }

    if (!validateSemester(semester)) {
        console.error("Invalid semester. Expected 1, 2, or 3.");
        return;
    }

    // Check if the session and semester actually exist.
    const serverSessions = await ttmsService.fetchSessions();

    if (!serverSessions) {
        console.error("Failed to fetch sessions");
        return;
    }

    const serverSession = serverSessions.find(
        (s) => s.sesi === session && s.semester === semester
    );

    if (!serverSession) {
        console.error("No sessions found for", session, "semester", semester);
        return;
    }

    await db
        .insert(sessions)
        .ignore()
        .values({
            session: session,
            semester: semester,
            startDate: new Date(serverSession.tarikh_mula),
            endDate: new Date(serverSession.tarikh_tamat),
        });

    console.log(
        "Inserted session",
        session,
        "semester",
        semester,
        "from",
        serverSession.tarikh_mula,
        "to",
        serverSession.tarikh_tamat
    );

    console.log("Retrieving students");
    await retrieveStudents(session, semester);

    console.log("Retrieving lecturers");
    await retrieveLecturers(session, semester);

    console.log("Retrieving courses");
    await retrieveCourses(session, semester);

    console.log("Retrieving course sections");
    await retrieveCourseSections(session, semester);

    console.log("Retrieving course section schedules");
    const savedCourseSections = await db
        .select({
            session: courseSections.session,
            semester: courseSections.semester,
            courseCode: courseSections.courseCode,
            section: courseSections.section,
        })
        .from(courseSections)
        .where(
            and(
                eq(courseSections.session, session),
                eq(courseSections.semester, semester)
            )
        );

    for (const courseSection of savedCourseSections) {
        await retrieveCourseSectionSchedules(courseSection);
    }

    console.log("Retrieving student registered courses");
    const savedStudents = await db
        .select({ matricNo: students.matricNo })
        .from(students);

    for (let i = 0; i < savedStudents.length; i++) {
        await sleep(500);
        await retrieveStudentRegisteredCourses(savedStudents[i].matricNo);

        console.log(
            `Current progress: (${(i + 1).toString()}/${savedStudents.length.toString()})`
        );
    }

    console.log("Retrieving student KP numbers");
    await retrieveStudentKpNo();

    console.log("Done");
})()
    .catch(console.error)
    .finally(() => {
        process.exit(0);
    });
