import {
    ICourse,
    ICourseSectionSchedule,
    ILecturer,
    IVenue,
} from "@/database/schema";
import { CourseSectionScheduleDay, CourseSectionScheduleTime } from "./ttms";

/**
 * Raw result of a timetable from the database.
 */
export interface IRawTimetable {
    readonly scheduleDay: CourseSectionScheduleDay;
    readonly scheduleTime: CourseSectionScheduleTime;
    readonly venueShortName: string | null;
    readonly courseCode: string;
    readonly section: string;
    readonly courseName: string;
    readonly lecturerNo: number | null;
    readonly lecturerName: string | null;
}

/**
 * Raw result of a venue clash in a timetable from the database.
 */
export interface IRawVenueClashTimetable {
    readonly lecturerNo: number | null;
    readonly lecturerName: string | null;
    readonly courseCode: string;
    readonly courseName: string;
    readonly section: string;
    readonly scheduleDay: CourseSectionScheduleDay;
    readonly scheduleTime: CourseSectionScheduleTime;
    // TODO: this should not return null. See: https://github.com/drizzle-team/drizzle-orm/issues/2956
    readonly scheduleVenue: string | null;
}

/**
 * Represents a course section in a timetable.
 */
export interface ITimetableCourseSection {
    readonly section: string;
    readonly course: Pick<ICourse, "code" | "name">;
    readonly lecturer: ILecturer | null;
}

/**
 * Represents a timetable.
 */
export interface ITimetable
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly courseSection: ITimetableCourseSection;
    readonly venue: Pick<IVenue, "shortName"> | null;
}

/**
 * Represents a venue clash in a timetable.
 */
export interface IVenueClashTimetable
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: Pick<IVenue, "shortName"> | null;
    readonly courseSections: ITimetableCourseSection[];
}
