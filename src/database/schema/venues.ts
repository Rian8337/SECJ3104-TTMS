import { relations } from "drizzle-orm";
import { mysqlTable, smallint, tinyint, varchar } from "drizzle-orm/mysql-core";
import { courseSectionSchedules } from "./courseSectionSchedules";

/**
 * The table for storing venues.
 */
export const venues = mysqlTable("venue", {
    /**
     * The code of the venue.
     */
    code: varchar({ length: 16 }).primaryKey(),

    /**
     * The name of the venue.
     */
    name: varchar({ length: 50 }).notNull(),

    /**
     * The short name of the venue.
     */
    shortName: varchar("short_name", { length: 8 }).notNull(),

    /**
     * The capacity of the venue.
     */
    capacity: smallint({ unsigned: true }).notNull(),

    /**
     * The type of the venue.
     */
    type: tinyint({ unsigned: true }).$type<VenueType>().notNull(),
});

export const venueRelations = relations(venues, ({ many }) => ({
    /**
     * The course section schedules that are scheduled in this venue.
     */
    schedules: many(courseSectionSchedules),
}));

/**
 * The type of the venue.
 */
export enum VenueType {
    none,
    laboratory,
    lectureRoom,
}

export type IVenue = typeof venues.$inferSelect;
export type IVenueInsert = typeof venues.$inferInsert;
