import { dependencyTokens } from "@/dependencies/tokens";
import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    IRawTimetable,
} from "@/types";
import {
    createTestContainer,
    cleanupSecondaryTables,
    seededPrimaryData,
    seeders,
} from "@test/setup";

describe("StudentRepository (integration)", () => {
    const container = createTestContainer();
    const repository = container.resolve(dependencyTokens.studentRepository);

    describe("getByMatricNo", () => {
        it("Should return null if student does not exist", async () => {
            const student = await repository.getByMatricNo(
                "NON_EXISTENT_MATRIC"
            );

            expect(student).toBeNull();
        });

        it("Should return student if it exists", async () => {
            const student = seededPrimaryData.students[0];
            const result = await repository.getByMatricNo(student.matricNo);

            expect(result).toEqual(student);
        });
    });

    describe("getTimetable", () => {
        const firstSession = seededPrimaryData.sessions[0];
        const student = seededPrimaryData.students[0];
        const lecturer = seededPrimaryData.lecturers[0];
        const course = seededPrimaryData.courses[0];

        beforeAll(async () => {
            const [firstSection, secondSection] =
                await seeders.courseSection.seedMany(
                    {
                        session: firstSession.session,
                        semester: firstSession.semester,
                        courseCode: course.code,
                        section: "1",
                        lecturerNo: lecturer.workerNo,
                    },
                    {
                        session: firstSession.session,
                        semester: firstSession.semester,
                        courseCode: course.code,
                        section: "2",
                        lecturerNo: lecturer.workerNo,
                    }
                );

            await seeders.courseSectionSchedule.seedMany(
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: course.code,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                },
                {
                    session: firstSection.session,
                    semester: firstSection.semester,
                    courseCode: course.code,
                    section: firstSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time3,
                },
                // Should not be included in the timetable since it's a different session and semester.
                {
                    session: secondSection.session,
                    semester: secondSection.semester,
                    courseCode: course.code,
                    section: secondSection.section,
                    day: CourseSectionScheduleDay.monday,
                    time: CourseSectionScheduleTime.time2,
                }
            );

            await seeders.studentRegisteredCourse.seedMany({
                session: firstSession.session,
                semester: firstSession.semester,
                courseCode: course.code,
                section: firstSection.section,
                matricNo: student.matricNo,
            });
        });

        afterAll(cleanupSecondaryTables);

        it("Should return student timetable for the given academic session and semester", async () => {
            const timetable = await repository.getTimetable(
                student.matricNo,
                firstSession.session,
                firstSession.semester
            );

            expect(timetable).toHaveLength(2);

            expect(timetable[0]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerNo: lecturer.workerNo,
                lecturerName: lecturer.name,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time2,
                venueShortName: null,
            } satisfies IRawTimetable);

            expect(timetable[1]).toEqual({
                courseCode: course.code,
                courseName: course.name,
                section: "1",
                lecturerNo: lecturer.workerNo,
                lecturerName: lecturer.name,
                scheduleDay: CourseSectionScheduleDay.monday,
                scheduleTime: CourseSectionScheduleTime.time3,
                venueShortName: null,
            } satisfies IRawTimetable);
        });
    });

    describe("Search student", () => {
        const [firstStudent, secondStudent] = seededPrimaryData.students;
        const [firstSession, secondSession] = seededPrimaryData.sessions;
        const course = seededPrimaryData.courses[0];

        beforeAll(async () => {
            const [section] = await seeders.courseSection.seedMany(
                {
                    session: firstSession.session,
                    semester: firstSession.semester,
                    courseCode: course.code,
                    section: "1",
                },
                {
                    session: secondSession.session,
                    semester: secondSession.semester,
                    courseCode: course.code,
                    section: "1",
                }
            );

            await seeders.studentRegisteredCourse.seedMany(
                {
                    session: firstSession.session,
                    semester: firstSession.semester,
                    courseCode: course.code,
                    section: section.section,
                    matricNo: firstStudent.matricNo,
                },
                {
                    session: secondSession.session,
                    semester: secondSession.semester,
                    courseCode: course.code,
                    section: section.section,
                    matricNo: secondStudent.matricNo,
                }
            );
        });

        afterAll(cleanupSecondaryTables);

        describe("searchByMatricNo", () => {
            it("Should return empty array if no student matches", async () => {
                const results = await repository.searchByMatricNo(
                    firstSession.session,
                    firstSession.semester,
                    "NON_EXISTENT_MATRIC",
                    10,
                    0
                );

                expect(results).toHaveLength(0);
            });

            it("Should return student matching matric number for the given academic session and semester", async () => {
                const results = await repository.searchByMatricNo(
                    firstSession.session,
                    firstSession.semester,
                    firstStudent.matricNo,
                    10,
                    0
                );

                expect(results).toHaveLength(1);
            });
        });

        describe("searchByName", () => {
            it("Should return empty array if no student matches", async () => {
                const results = await repository.searchByName(
                    firstSession.session,
                    firstSession.semester,
                    "Non Existent",
                    10,
                    0
                );

                expect(results).toHaveLength(0);
            });

            it("Should return student matching name for the given academic session and semester", async () => {
                const results = await repository.searchByName(
                    firstSession.session,
                    firstSession.semester,
                    "John",
                    10,
                    0
                );

                expect(results).toHaveLength(1);
            });
        });
    });
});
