import { TTMSSemester, TTMSSession } from "@/types";
import { relations } from "drizzle-orm";
import {
    foreignKey,
    mysqlTable,
    primaryKey,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { courseSections } from "./courseSections";
import { students } from "./students";

/**
 * The table for storing course section enrollments.
 */
export const studentRegisteredCourses = mysqlTable(
    "student_registered_course",
    {
        /**
         * The matric number of the student.
         */
        matricNo: varchar("matric_no", { length: 9 }).notNull(),

        /**
         * The session of the course section.
         */
        session: varchar({ length: 9 }).$type<TTMSSession>().notNull(),

        /**
         * The semester of the course section.
         */
        semester: tinyint({ unsigned: true }).$type<TTMSSemester>().notNull(),

        /**
         * The code of the course.
         */
        courseCode: varchar("course_code", { length: 8 }).notNull(),

        /**
         * The section of this course section.
         */
        section: varchar({ length: 4 }).notNull(),
    },
    (table) => [
        primaryKey({
            name: "student_registered_course_pkey",
            columns: [
                table.matricNo,
                table.session,
                table.semester,
                table.courseCode,
                table.section,
            ],
        }),
        foreignKey({
            name: "fk_student_registered_course_matric_no",
            columns: [table.matricNo],
            foreignColumns: [students.matricNo],
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
        foreignKey({
            name: "fk_student_registered_course_session_course",
            columns: [
                table.session,
                table.semester,
                table.courseCode,
                table.section,
            ],
            foreignColumns: [
                courseSections.session,
                courseSections.semester,
                courseSections.courseCode,
                courseSections.section,
            ],
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
    ]
);

export const studentRegisteredCourseRelations = relations(
    studentRegisteredCourses,
    ({ one }) => ({
        /**
         * The student who registered for this course section.
         */
        student: one(students, {
            fields: [studentRegisteredCourses.matricNo],
            references: [students.matricNo],
        }),

        /**
         * The course section that this student is registered for.
         */
        courseSection: one(courseSections, {
            fields: [
                studentRegisteredCourses.session,
                studentRegisteredCourses.semester,
                studentRegisteredCourses.courseCode,
                studentRegisteredCourses.section,
            ],
            references: [
                courseSections.session,
                courseSections.semester,
                courseSections.courseCode,
                courseSections.section,
            ],
        }),
    })
);

export type IStudentRegisteredCourse =
    typeof studentRegisteredCourses.$inferSelect;

export type IStudentRegisteredCourseInsert =
    typeof studentRegisteredCourses.$inferInsert;
