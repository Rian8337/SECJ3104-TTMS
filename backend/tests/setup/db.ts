import { AnyMySqlTable } from "drizzle-orm/mysql-core";
import { db } from "@/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
    lecturers,
    sessions,
    studentRegisteredCourses,
    students,
    venues,
    VenueType,
} from "@/database/schema";

//#region Global Database Seeding

type Insert<T extends AnyMySqlTable> = T["$inferInsert"];

/**
 * The seeded data for primary tables.
 */
export const seededPrimaryData = {
    /**
     * The seeded sessions.
     */
    sessions: [
        {
            session: "2023/2024",
            semester: 2,
            startDate: new Date("2024-02-01"),
            endDate: new Date("2024-06-30"),
        },
        {
            session: "2023/2024",
            semester: 1,
            startDate: new Date("2023-09-01"),
            endDate: new Date("2024-01-31"),
        },
    ] as const satisfies readonly Insert<typeof sessions>[],

    /**
     * The seeded students.
     */
    students: [
        {
            matricNo: "A12CS1234",
            name: "John Doe",
            courseCode: "SECBH",
            facultyCode: "FSKSM",
            kpNo: "201210M35216",
        },
        {
            matricNo: "A12CS5678",
            name: "Jane Smith",
            courseCode: "SECVH",
            facultyCode: "FC",
            kpNo: "201210M35217",
        },
    ] as const satisfies readonly Insert<typeof students>[],

    /**
     * The seeded lecturers.
     */
    lecturers: [
        { workerNo: 1, name: "Dr. Jane Smith" },
        { workerNo: 2, name: "Prof. John Doe" },
        { workerNo: 3, name: "Dr. Alice Johnson" },
    ] as const satisfies readonly Insert<typeof lecturers>[],

    /**
     * The seeded courses.
     */
    courses: [
        {
            code: "SECJ1013",
            name: "Programming Technique 1",
            credits: 3,
        },
        {
            code: "SECJ1023",
            name: "Programming Technique 2",
            credits: 3,
        },
        {
            code: "SECJ1033",
            name: "Data Structures and Algorithms",
            credits: 3,
        },
    ] as const satisfies readonly Insert<typeof courses>[],

    /**
     * The seeded venues.
     */
    venues: [
        {
            code: "N28-VN-101",
            capacity: 100,
            name: "Venue 101",
            shortName: "V101",
            type: VenueType.laboratory,
        },
        {
            code: "N28A-VN-102",
            capacity: 200,
            name: "Venue 102",
            shortName: "V102",
            type: VenueType.lectureRoom,
        },
    ] as const satisfies readonly Insert<typeof venues>[],
} as const;

/**
 * Seeds primary tables ({@link sessions}, {@link students}, {@link lecturers}, {@link courses},
 * and {@link venues}) with {@link seededPrimaryData}.
 *
 * Additional data can be seeded by calling the respective {@link seeders}.
 */
export async function seedPrimaryTables() {
    await db.transaction(async (tx) => {
        await tx.insert(sessions).values(seededPrimaryData.sessions.slice());
        await tx.insert(students).values(seededPrimaryData.students.slice());
        await tx.insert(lecturers).values(seededPrimaryData.lecturers.slice());
        await tx.insert(courses).values(seededPrimaryData.courses.slice());
        await tx.insert(venues).values(seededPrimaryData.venues.slice());
    });
}

//#endregion

//#region Table Reset

/**
 * Deletes all records from primary tables ({@link sessions}, {@link students}, {@link lecturers},
 * {@link courses}, and {@link venues}).
 *
 * **Because these are primary tables, all secondary tables that reference these tables will also
 * be affected.**
 */
export async function cleanupPrimaryTables() {
    await db.delete(courses);
    await db.delete(sessions);
    await db.delete(students);
    await db.delete(lecturers);
    await db.delete(venues);
}

/**
 * Deletes all records from secondary tables ({@link courseSections}, {@link courseSectionSchedules},
 * and {@link studentRegisteredCourses}).
 *
 * This will not affect primary tables. To clean up primary tables, use {@link cleanupPrimaryTables}
 * instead.
 */
export async function cleanupSecondaryTables() {
    await db.delete(courseSectionSchedules);
    await db.delete(studentRegisteredCourses);
    await db.delete(courseSections);
}

//#endregion

//#region Per-Table Seeders

interface TableSeeder<T extends AnyMySqlTable> {
    /**
     * Seeds the database with a single record for the given table.
     *
     * @param value The value to seed into the table.
     * @returns The seeded value.
     */
    readonly seedOne: (value: Insert<T>) => Promise<Insert<T>>;

    /**
     * Seeds the database with multiple records for the given table.
     *
     * @param values The values to seed into the table.
     * @returns The seeded values.
     */
    readonly seedMany: (...values: Insert<T>[]) => Promise<Insert<T>[]>;
}

/**
 * Creates a seeder for the given table.
 *
 * @param table The table to create a seeder for.
 * @returns An object containing methods to seed one or many records into the table.
 */
function createSeeder<T extends AnyMySqlTable>(table: T): TableSeeder<T> {
    return {
        seedOne: async (value) => {
            await db.insert(table).values(value);

            return value;
        },

        seedMany: async (...values) => {
            await db.insert(table).values(values);

            return values;
        },
    };
}

/**
 * Seeders for the database.
 */
export const seeders = {
    /**
     * Seeder for the course table.
     */
    course: createSeeder(courses),

    /**
     * Seeder for the course section table.
     */
    courseSection: createSeeder(courseSections),

    /**
     * Seeder for the course section schedule table.
     */
    courseSectionSchedule: createSeeder(courseSectionSchedules),

    /**
     * Seeder for the lecturer table.
     */
    lecturer: createSeeder(lecturers),

    /**
     * Seeder for the session table.
     */
    session: createSeeder(sessions),

    /**
     * Seeder for the student table.
     */
    student: createSeeder(students),

    /**
     * Seeder for the student registered course table.
     */
    studentRegisteredCourse: createSeeder(studentRegisteredCourses),

    /**
     * Seeder for the venue table.
     */
    venue: createSeeder(venues),
} as const;

//#endregion
