import { TTMSSemester, TTMSSession } from "@/types";
import { relations } from "drizzle-orm";
import {
    mysqlTable,
    primaryKey,
    timestamp,
    tinyint,
    varchar,
} from "drizzle-orm/mysql-core";
import { courseSections } from "./courseSections";

/**
 * The table for storing sessions in academic calendar.
 */
export const sessions = mysqlTable(
    "session",
    {
        /**
         * The session.
         */
        session: varchar({ length: 9 }).$type<TTMSSession>().notNull(),

        /**
         * The semester of the session.
         */
        semester: tinyint({ unsigned: true }).$type<TTMSSemester>().notNull(),

        /**
         * The start date of the session.
         */
        startDate: timestamp("start_date").notNull().defaultNow(),

        /**
         * The end date of the session.
         */
        endDate: timestamp("end_date").notNull().defaultNow(),
    },
    (table) => [primaryKey({ columns: [table.session, table.semester] })]
);

export const sessionRelations = relations(sessions, ({ many }) => ({
    /**
     * The courses that are offered in this session and semester, along with their sections.
     */
    courses: many(courseSections),
}));

export type ISession = typeof sessions.$inferSelect;
export type ISessionInsert = typeof sessions.$inferInsert;
