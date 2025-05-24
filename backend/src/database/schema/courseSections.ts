import { TTMSSemester, TTMSSession } from "@/types";
import { relations } from "drizzle-orm";
import {
    foreignKey,
    mediumint,
    mysqlTable,
    primaryKey,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { courses } from "./courses";
import { courseSectionSchedules } from "./courseSectionSchedules";
import { lecturers } from "./lecturers";
import { sessions } from "./sessions";

/**
 * The table for storing course sections within a session and semester.
 */
export const courseSections = mysqlTable(
    "course_section",
    {
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

        /**
         * The lecturer of this course section.
         */
        lecturerNo: mediumint("lecturer_no", { unsigned: true }),
    },
    (table) => [
        primaryKey({
            name: "course_section_pkey",
            columns: [
                table.session,
                table.semester,
                table.courseCode,
                table.section,
            ],
        }),
        foreignKey({
            name: "fk_course_section_session_semester",
            columns: [table.session, table.semester],
            foreignColumns: [sessions.session, sessions.semester],
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
        foreignKey({
            name: "fk_course_section_course_code",
            columns: [table.courseCode],
            foreignColumns: [courses.code],
        })
            .onDelete("cascade")
            .onUpdate("cascade"),
        foreignKey({
            name: "fk_course_section_lecturer_no",
            columns: [table.lecturerNo],
            foreignColumns: [lecturers.workerNo],
        })
            .onDelete("set null")
            .onUpdate("cascade"),
    ]
);

export const courseSectionRelations = relations(
    courseSections,
    ({ one, many }) => ({
        /**
         * The session and semester of this course section.
         */
        session: one(sessions, {
            fields: [courseSections.session, courseSections.semester],
            references: [sessions.session, sessions.semester],
        }),

        /**
         * The course that this course section belongs to.
         */
        course: one(courses, {
            fields: [courseSections.courseCode],
            references: [courses.code],
        }),

        /**
         * The lecturer of this course section.
         */
        lecturer: one(lecturers, {
            fields: [courseSections.lecturerNo],
            references: [lecturers.workerNo],
        }),

        /**
         * The schedules of this course section.
         */
        schedules: many(courseSectionSchedules),
    })
);

export type ICourseSection = typeof courseSections.$inferSelect;
export type ICourseSectionInsert = typeof courseSections.$inferInsert;
