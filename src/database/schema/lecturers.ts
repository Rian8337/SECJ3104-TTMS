import { relations } from "drizzle-orm";
import { mysqlTable, mediumint, varchar } from "drizzle-orm/mysql-core";
import { courseSections } from "./courseSections";
import { index } from "drizzle-orm/mysql-core";

/**
 * The table for storing lecturers.
 */
export const lecturers = mysqlTable(
    "lecturer",
    {
        /**
         * The staff number of the lecturer.
         */
        workerNo: mediumint("worker_no", { unsigned: true }).primaryKey(),

        /**
         * The name of the lecturer.
         */
        name: varchar({ length: 100 }).notNull(),
    },
    (table) => [index("idx_lecturer_name").on(table.name)]
);

export const lecturerRelations = relations(lecturers, ({ many }) => ({
    /**
     * The sections that are taught by this lecturer.
     */
    sections: many(courseSections),
}));

export type ILecturer = typeof lecturers.$inferSelect;
export type ILecturerInsert = typeof lecturers.$inferInsert;

/**
 * Checks if the given object is a lecturer.
 *
 * @param obj The object to check.
 * @returns `true` if the object is a lecturer, `false` otherwise.
 */
export function isLecturer(obj: unknown): obj is ILecturer {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "name" in obj &&
        "workerNo" in obj
    );
}
