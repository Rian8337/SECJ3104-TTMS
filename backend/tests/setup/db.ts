import { AnyMySqlTable } from "drizzle-orm/mysql-core";
import { db } from "../../src/database";
import {
    courses,
    courseSections,
    courseSectionSchedules,
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

//#region Database Seeding

type Insert<T extends AnyMySqlTable> = T["$inferInsert"];

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
