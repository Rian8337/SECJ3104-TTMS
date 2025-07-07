import { TTMSService } from "@/api";
import { db } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    ICourseInsert,
    ICourseSection,
    ICourseSectionInsert,
    ICourseSectionScheduleInsert,
    ILecturerInsert,
    IStudentInsert,
    IStudentRegisteredCourseInsert,
    lecturers,
    studentRegisteredCourses,
    students,
    venues,
    VenueType,
} from "@/database/schema";
import {
    IAPICourseSectionStudent,
    IAPILecturer,
    IAPIStudent,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { sleep } from "@/utils";
import { eq, or, sql } from "drizzle-orm";

const ttmsService = new TTMSService();

//#region Authentication

let sessionId: string | null = null;

/**
 * Authenticates with the TTMS service and returns the session ID.
 */
async function authenticate() {
    if (sessionId) {
        return sessionId;
    }

    const auth = await ttmsService.login(
        process.env.SCRAPER_MATRIC_NO!,
        process.env.SCRAPER_PASSWORD!
    );

    if (!auth) {
        throw new Error("Failed to authenticate");
    }

    sessionId = await ttmsService.elevateSession(auth.session_id);

    if (!sessionId) {
        throw new Error("Failed to elevate session");
    }

    return sessionId;
}

/**
 * Invalidates the current session.
 */
function invalidateSession() {
    sessionId = null;
}

//#endregion

//#region Retrievers

/**
 * Retrieves students for a given academic session and semester from upstream service.
 *
 * @param session The academic session.
 * @param semester The semester (1, 2, or 3).
 */
export async function retrieveStudents(
    session: TTMSSession,
    semester: TTMSSemester
) {
    // Need to authenticate first
    let sessionId = await authenticate();
    const studentsPerFetch = 50;
    let offset = 0;

    // Sessions before 2007/2008 appear to have no students
    if (
        session === "2006/2007" ||
        session === "2005/2006" ||
        session === "2004/2005"
    ) {
        return;
    }

    let sessionRefreshAttempts = 0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        await sleep(1000);

        let serverStudents: IAPIStudent[] | null = null;

        try {
            serverStudents = await ttmsService.fetchStudents({
                sessionId: sessionId,
                session: session,
                semester: semester,
                limit: studentsPerFetch,
                offset: offset,
            });

            sessionRefreshAttempts = 0;
        } catch (e) {
            console.error(
                "Failed to fetch students for session",
                session,
                semester,
                e
            );

            sessionRefreshAttempts++;

            if (sessionRefreshAttempts >= 3) {
                console.error("Failed to fetch students after 3 attempts");
                break;
            }

            invalidateSession();
            sessionId = await authenticate();

            continue;
        }

        if (serverStudents === null) {
            break;
        }

        if (serverStudents.length > 0) {
            await db
                .insert(students)
                .values(
                    serverStudents.map(
                        (s): IStudentInsert => ({
                            matricNo: s.no_matrik,
                            name: s.nama,
                            courseCode: s.kod_kursus,
                            facultyCode: s.kod_fakulti,
                            kpNo: s.no_kp,
                        })
                    )
                )
                .onDuplicateKeyUpdate({
                    set: {
                        name: sql`VALUES(${students.name})`,
                        courseCode: sql`VALUES(${students.courseCode})`,
                        facultyCode: sql`VALUES(${students.facultyCode})`,
                        kpNo: sql`VALUES(${students.kpNo})`,
                    },
                });
        }

        console.log(
            "Inserted",
            serverStudents.length,
            "student(s) for session",
            session,
            semester,
            "offset",
            offset
        );

        if (serverStudents.length < studentsPerFetch) {
            break;
        }

        offset += studentsPerFetch;
    }

    console.log(
        "Finished fetching students for session",
        session,
        "semester",
        semester
    );
}

/**
 * Retrieves lecturers for a given academic session and semester from upstream service.
 *
 * @param session The academic session.
 * @param semester The semester (1, 2, or 3).
 */
export async function retrieveLecturers(
    session: TTMSSession,
    semester: TTMSSemester
) {
    const sessionId = await authenticate();
    let serverLecturers: IAPILecturer[] | null = null;

    try {
        serverLecturers = await ttmsService.fetchLecturers({
            sessionId: sessionId,
            session: session,
            semester: semester,
        });
    } catch (e) {
        console.error(
            "Failed to fetch lecturers for session",
            session,
            semester,
            e
        );
    }

    if (serverLecturers === null) {
        return;
    }

    if (serverLecturers.length > 0) {
        await db
            .insert(lecturers)
            .values(
                serverLecturers.map(
                    (s): ILecturerInsert => ({
                        name: s.nama,
                        workerNo: s.no_pekerja,
                    })
                )
            )
            .onDuplicateKeyUpdate({
                set: { name: sql`VALUES(${lecturers.name})` },
            });
    }

    console.log(
        "Inserted",
        serverLecturers.length,
        "lecturer(s) for session",
        session,
        semester
    );
}

/**
 * Retrieves courses for a given academic session and semester from upstream service.
 *
 * @param session The academic session.
 * @param semester The semester (1, 2, or 3).
 */
export async function retrieveCourses(
    session: TTMSSession,
    semester: TTMSSemester
) {
    // Sessions before 2006/2007 have no courses
    if (session === "2005/2006" || session === "2004/2005") {
        return;
    }

    const serverCourses = await ttmsService.fetchCourses(session, semester);

    if (!serverCourses) {
        console.error("Failed to fetch courses for session", session, semester);
        return;
    }

    await db
        .insert(courses)
        .values(
            serverCourses.map(
                (c): ICourseInsert => ({
                    code: c.kod_subjek,
                    name: c.nama_subjek,
                    credits: parseInt(c.kod_subjek.split("").at(-1)!) || 0,
                })
            )
        )
        .onDuplicateKeyUpdate({
            set: {
                name: sql`VALUES(${courses.name})`,
                credits: sql`VALUES(${courses.credits})`,
            },
        });

    console.log(
        "Inserted",
        serverCourses.length,
        "courses for session",
        session,
        semester
    );
}

/**
 * Retrieves course sections for a given academic session and semester from upstream service.
 *
 * @param session The academic session.
 * @param semester The semester (1, 2, or 3).
 */
export async function retrieveCourseSections(
    session: TTMSSession,
    semester: TTMSSemester
) {
    // Sessions before 2006/2007 have no courses
    if (session === "2005/2006" || session === "2004/2005") {
        return;
    }

    const serverCourseSections = await ttmsService.fetchCourseSections(
        session,
        semester
    );

    if (serverCourseSections === null) {
        console.error(
            "Failed to fetch course sections for session",
            session,
            semester
        );

        return;
    }

    const mappedCourseSections = serverCourseSections.map(
        async (c): Promise<ICourseSectionInsert[]> => {
            if (!c.seksyen_list) {
                return [];
            }

            const lecturerNames = c.seksyen_list
                .map((s) => s.pensyarah)
                .filter((n) => n !== null);

            const sessionLecturers = await db
                .select()
                .from(lecturers)
                .where(or(...lecturerNames.map((n) => eq(lecturers.name, n))));

            return c.seksyen_list.map(
                (s): ICourseSectionInsert => ({
                    session: session,
                    semester: semester,
                    courseCode: c.kod_subjek,
                    section: s.seksyen,
                    lecturerNo:
                        s.pensyarah !== null
                            ? sessionLecturers.find(
                                  (l) => l.name === s.pensyarah
                              )?.workerNo
                            : null,
                })
            );
        }
    );

    if (mappedCourseSections.length > 0) {
        await db
            .insert(courseSections)
            .values((await Promise.all(mappedCourseSections)).flat())
            .onDuplicateKeyUpdate({
                set: { lecturerNo: sql`VALUES(${courseSections.lecturerNo})` },
            });
    }

    console.log(
        "Inserted",
        serverCourseSections.length,
        "course section(s) for session",
        session,
        semester
    );
}

/**
 * Retrieves course section schedules for a given course section from upstream service.
 *
 * @param courseSection The course section to retrieve schedules for.
 */
export async function retrieveCourseSectionSchedules(
    courseSection: Pick<
        ICourseSection,
        "session" | "semester" | "courseCode" | "section"
    >
) {
    const serverSessionCourseTimetables =
        await ttmsService.fetchCourseTimetable(courseSection);

    if (serverSessionCourseTimetables === null) {
        console.error(
            "Failed to fetch course timetables for session",
            courseSection.session,
            courseSection.semester,
            "course code",
            courseSection.courseCode,
            "section",
            courseSection.section
        );

        return;
    }

    if (serverSessionCourseTimetables.length === 0) {
        console.log(
            "No course section schedules found for session",
            courseSection.session,
            courseSection.semester,
            "course code",
            courseSection.courseCode,
            "section",
            courseSection.section
        );

        return;
    }

    if (!serverSessionCourseTimetables[0].kod_subjek) {
        console.error(
            "Invalid course section schedule found for session",
            courseSection.session,
            courseSection.semester,
            "course code",
            courseSection.courseCode,
            "section",
            courseSection.section
        );

        return;
    }

    // Sometimes, the schedule clashes with itself (i.e., 2019/2010 semester 1 SCJ2153 section 8).
    // In that case, we need to remove the duplicate schedules.
    const uniqueSchedules = new Set<string>();

    const filteredServerSessionCourseTimetables =
        serverSessionCourseTimetables.filter((c) => {
            const key = `${c.kod_subjek!}-${c.seksyen!}-${c.hari!.toString()}-${c.masa!.toString()}`;

            if (uniqueSchedules.has(key)) {
                return false;
            }

            uniqueSchedules.add(key);
            return true;
        });

    const courseSectionSchedulesToInsert = await Promise.all(
        filteredServerSessionCourseTimetables.map(
            async (c): Promise<ICourseSectionScheduleInsert> => {
                // Sometimes the venue is not recorded in upstream database.
                // In that case, we need to insert the venue.
                if (c.ruang) {
                    // Ignore duplicate venues.
                    await db.insert(venues).ignore().values({
                        code: c.ruang.kod_ruang,
                        name: c.ruang.nama_ruang,
                        shortName: c.ruang.nama_ruang_singkatan,
                        capacity: 0,
                        type: VenueType.none,
                    });
                }

                return {
                    session: courseSection.session,
                    semester: courseSection.semester,
                    courseCode: c.kod_subjek!,
                    section: c.seksyen!,
                    day: c.hari!,
                    time: c.masa!,
                    venueCode: c.ruang?.kod_ruang,
                };
            }
        )
    );

    await db
        .insert(courseSectionSchedules)
        .values(courseSectionSchedulesToInsert);

    console.log(
        "Inserted",
        serverSessionCourseTimetables.length,
        "course section schedule(s) for session",
        courseSection.session,
        courseSection.semester,
        "course code",
        courseSection.courseCode,
        "section",
        courseSection.section
    );
}

/**
 * Retrieves registered courses for a student from upstream service.
 *
 * @param matricNo The student's matriculation number.
 */
export async function retrieveStudentRegisteredCourses(matricNo: string) {
    const studentCourses = await ttmsService.fetchStudentCourses(matricNo);

    if (studentCourses === null) {
        console.error("Failed to fetch courses for student", matricNo);
        return;
    }

    if (studentCourses.length > 0) {
        await db
            .insert(studentRegisteredCourses)
            .ignore()
            .values(
                studentCourses.map(
                    (c): IStudentRegisteredCourseInsert => ({
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
        matricNo
    );
}

/**
 * Retrieves the KP number for students who do not have it recorded in the database.
 *
 * The regular student API does not return the KP number of students. As such, we need
 * to use other means to get them.
 */
export async function retrieveStudentKpNo() {
    const noKpMap = new Map<string, string>();

    const studentsWithoutNoKp = await db
        .select({
            name: students.name,
            matricNo: students.matricNo,
        })
        .from(students)
        .where(eq(students.kpNo, "-"));

    let sessionId = await authenticate();
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

            invalidateSession();
            sessionId = await authenticate();

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
}

//#endregion
