import { relations } from "drizzle-orm";
import { mysqlTable, tinyint, varchar } from "drizzle-orm/mysql-core";
import { courseSections } from "./courseSections";

/**
 * The table for storing courses.
 */
export const courses = mysqlTable("course", {
    /**
     * The code of the course.
     */
    code: varchar({ length: 8 }).primaryKey(),

    /**
     * The name of the course.
     */
    name: varchar({ length: 100 }).notNull(),

    /**
     * The number of credits of the course.
     */
    credits: tinyint({ unsigned: true }).notNull(),
});

export const courseRelations = relations(courses, ({ many }) => ({
    /**
     * The sections that belong to this course.
     */
    sections: many(courseSections),
}));

export type ICourse = typeof courses.$inferSelect;
export type ICourseInsert = typeof courses.$inferInsert;
