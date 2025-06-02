import { db } from "../../src/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    ICourse,
    ICourseSection,
    ICourseSectionSchedule,
    ILecturer,
    ISession,
    IStudent,
    IStudentRegisteredCourse,
    IVenue,
    lecturers,
    sessions,
    studentRegisteredCourses,
    students,
    venues,
} from "../../src/database/schema";

/**
 * Resets the database to a clean state by truncating all tables.
 */
export async function resetDb() {
    // We only need to delete top-level tables as the foreign key constraints will handle the rest.
    await db.delete(courses);
    await db.delete(lecturers);
    await db.delete(sessions);
    await db.delete(students);
    await db.delete(venues);
}

//#region Course Seeding

/**
 * Seeds the database with a course.
 *
 * @param course The course to seed.
 * @returns The seeded course.
 */
export async function seedCourse(course: ICourse): Promise<ICourse> {
    await db.insert(courses).values(course);

    return course;
}

/**
 * Seeds the database with multiple courses.
 *
 * @param coursesToSeed The courses to seed.
 * @returns The seeded courses.
 */
export async function seedCourses(
    ...coursesToSeed: ICourse[]
): Promise<ICourse[]> {
    await db.insert(courses).values(coursesToSeed);

    return coursesToSeed;
}

//#endregion

//#region Course Section Seeding

/**
 * Seeds the database with a course section.
 *
 * @param courseSection The course section to seed.
 * @returns The seeded course section.
 */
export async function seedCourseSection(
    courseSection: ICourseSection
): Promise<ICourseSection> {
    await db.insert(courseSections).values(courseSection);

    return courseSection;
}

/**
 * Seeds the database with multiple course sections.
 *
 * @param courseSectionsToSeed The course sections to seed.
 * @returns The seeded course sections.
 */
export async function seedCourseSections(
    ...courseSectionsToSeed: ICourseSection[]
): Promise<ICourseSection[]> {
    await db.insert(courseSections).values(courseSectionsToSeed);

    return courseSectionsToSeed;
}

//#endregion

//#region Course Section Schedule Seeding

/**
 * Seeds the database with a course section schedule.
 *
 * @param courseSectionSchedule The course section schedule to seed.
 * @returns The seeded course section schedule.
 */
export async function seedCourseSectionSchedule(
    courseSectionSchedule: ICourseSectionSchedule
): Promise<ICourseSectionSchedule> {
    await db.insert(courseSectionSchedules).values(courseSectionSchedule);

    return courseSectionSchedule;
}

/**
 * Seeds the database with multiple course section schedules.
 *
 * @param courseSectionSchedulesToSeed The course section schedules to seed.
 * @returns The seeded course section schedules.
 */
export async function seedCourseSectionSchedules(
    ...courseSectionSchedulesToSeed: ICourseSectionSchedule[]
): Promise<ICourseSectionSchedule[]> {
    await db
        .insert(courseSectionSchedules)
        .values(courseSectionSchedulesToSeed);

    return courseSectionSchedulesToSeed;
}

//#endregion

//#region Lecturer Seeding

/**
 * Seeds the database with a lecturer.
 *
 * @param lecturer The lecturer to seed.
 * @returns The seeded lecturer.
 */
export async function seedLecturer(lecturer: ILecturer): Promise<ILecturer> {
    await db.insert(lecturers).values(lecturer);

    return lecturer;
}

/**
 * Seeds the database with multiple lecturers.
 *
 * @param lecturersToSeed The lecturers to seed.
 * @returns The seeded lecturers.
 */
export async function seedLecturers(
    ...lecturersToSeed: ILecturer[]
): Promise<ILecturer[]> {
    await db.insert(lecturers).values(lecturersToSeed);

    return lecturersToSeed;
}

//#endregion

//#region Session Seeding

/**
 * Seeds the database with a session.
 *
 * @param session The session to seed.
 * @returns The seeded session.
 */
export async function seedSession(session: ISession): Promise<ISession> {
    await db.insert(sessions).values(session);

    return session;
}

/**
 * Seeds the database with multiple sessions.
 *
 * @param sessionsToSeed The sessions to seed.
 * @returns The seeded sessions.
 */
export async function seedSessions(
    ...sessionsToSeed: ISession[]
): Promise<ISession[]> {
    await db.insert(sessions).values(sessionsToSeed);

    return sessionsToSeed;
}

//#endregion

//#region Student Seeding

/**
 * Seeds the database with a student.
 *
 * @param student The student to seed.
 * @returns The seeded student.
 */
export async function seedStudent(student: IStudent): Promise<IStudent> {
    await db.insert(students).values(student);

    return student;
}

/**
 * Seeds the database with multiple students.
 *
 * @param studentsToSeed The students to seed.
 * @returns The seeded students.
 */
export async function seedStudents(
    ...studentsToSeed: IStudent[]
): Promise<IStudent[]> {
    await db.insert(students).values(studentsToSeed);

    return studentsToSeed;
}

//#endregion

//#region Student Registered Courses Seeding

/**
 * Seeds the database with a student registered course.
 *
 * @param studentRegisteredCourse The student registered course to seed.
 * @returns The seeded student registered course.
 */
export async function seedStudentRegisteredCourse(
    studentRegisteredCourse: IStudentRegisteredCourse
): Promise<IStudentRegisteredCourse> {
    await db.insert(studentRegisteredCourses).values(studentRegisteredCourse);

    return studentRegisteredCourse;
}

/**
 * Seeds the database with multiple student registered courses.
 *
 * @param studentRegisteredCoursesToSeed The student registered courses to seed.
 * @returns The seeded student registered courses.
 */
export async function seedStudentRegisteredCourses(
    ...studentRegisteredCoursesToSeed: IStudentRegisteredCourse[]
): Promise<IStudentRegisteredCourse[]> {
    await db
        .insert(studentRegisteredCourses)
        .values(studentRegisteredCoursesToSeed);

    return studentRegisteredCoursesToSeed;
}

//#endregion

//#region Venue Seeding

/**
 * Seeds the database with a venue.
 *
 * @param venue The venue to seed.
 * @returns The seeded venue.
 */
export async function seedVenue(venue: IVenue): Promise<IVenue> {
    await db.insert(venues).values(venue);

    return venue;
}

/**
 * Seeds the database with multiple venues.
 *
 * @param venuesToSeed The venues to seed.
 * @returns The seeded venues.
 */
export async function seedVenues(...venuesToSeed: IVenue[]): Promise<IVenue[]> {
    await db.insert(venues).values(venuesToSeed);

    return venuesToSeed;
}
