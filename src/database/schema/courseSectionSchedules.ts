import {
    CourseSectionScheduleDay,
    CourseSectionScheduleTime,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { relations } from "drizzle-orm";
import {
    foreignKey,
    mysqlTable,
    primaryKey,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { courseSections } from "./courseSections";
import { venues } from "./venues";

/**
 * The table for storing course section schedules.
 */
export const courseSectionSchedules = mysqlTable(
    "course_section_schedule",
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
         * The code of the venue where this course section is scheduled.
         */
        venueCode: varchar("venue_code", { length: 16 }),

        /**
         * The day of the week when this course section is scheduled.
         */
        day: tinyint({ unsigned: true })
            .$type<CourseSectionScheduleDay>()
            .notNull(),

        /**
         * The time in the day when this course section is scheduled.
         */
        time: tinyint({ unsigned: true })
            .$type<CourseSectionScheduleTime>()
            .notNull(),
    },
    (table) => [
        primaryKey({
            name: "course_section_schedule_pkey",
            columns: [
                table.session,
                table.semester,
                table.courseCode,
                table.section,
                table.day,
                table.time,
            ],
        }),
        foreignKey({
            name: "fk_course_section_schedule_session_course",
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
        foreignKey({
            name: "fk_course_section_schedule_venue",
            columns: [table.venueCode],
            foreignColumns: [venues.code],
        })
            .onDelete("set null")
            .onUpdate("cascade"),
    ]
);

export const courseSectionScheduleRelations = relations(
    courseSectionSchedules,
    ({ one }) => ({
        /**
         * The course section that this schedule belongs to.
         */
        courseSection: one(courseSections, {
            fields: [
                courseSectionSchedules.session,
                courseSectionSchedules.semester,
                courseSectionSchedules.courseCode,
                courseSectionSchedules.section,
            ],
            references: [
                courseSections.session,
                courseSections.semester,
                courseSections.courseCode,
                courseSections.section,
            ],
        }),

        /**
         * The venue where this schedule is held.
         */
        venue: one(venues, {
            fields: [courseSectionSchedules.venueCode],
            references: [venues.code],
        }),
    })
);

export type ICourseSectionSchedule = typeof courseSectionSchedules.$inferSelect;
export type ICourseSectionScheduleInsert =
    typeof courseSectionSchedules.$inferInsert;
