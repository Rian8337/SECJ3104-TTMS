import { TTMSCourseCode, TTMSFacultyCode } from "@/types";
import { relations } from "drizzle-orm";
import { index, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { studentRegisteredCourses } from "./studentRegisteredCourses";

/**
 * The table for storing students.
 */
export const students = mysqlTable(
    "student",
    {
        /**
         * The matric number of the student.
         */
        matricNo: varchar("matric_no", { length: 9 }).primaryKey(),

        /**
         * The name of the student.
         */
        name: varchar({ length: 100 }).notNull(),

        /**
         * The code of the course the student is enrolled in.
         */
        courseCode: varchar("course_code", { length: 8 })
            .$type<TTMSCourseCode>()
            .notNull(),

        /**
         * The code of the faculty the student is enrolled in.
         */
        facultyCode: varchar("faculty_code", { length: 8 })
            .$type<TTMSFacultyCode>()
            .notNull(),

        /**
         * The K.P. number of the student.
         */
        kpNo: varchar("kp_no", { length: 12 }).notNull(),
    },
    (table) => [index("idx_student_name").on(table.name)]
);

export const studentRelations = relations(students, ({ many }) => ({
    /**
     * The course sections that this student is registered for.
     */
    courses: many(studentRegisteredCourses),
}));

export type IStudent = typeof students.$inferSelect;
export type IStudentInsert = typeof students.$inferInsert;

/**
 * Checks if the given object is a student.
 *
 * @param obj The object to check.
 * @returns `true` if the object is a student, `false` otherwise.
 */
export function isStudent(obj: unknown): obj is IStudent {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "name" in obj &&
        "matricNo" in obj &&
        "courseCode" in obj &&
        "facultyCode" in obj &&
        "kpNo" in obj
    );
}
