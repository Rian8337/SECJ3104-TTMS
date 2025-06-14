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
 * Represents a course section in a timetable.
 */
export interface ITimetableCourseSection {
    readonly section: string;
    readonly course: ITimetableCourse;
    readonly lecturer: ILecturer | null;
}

/**
 * Represents a timetable.
 */
export interface ITimetable
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly courseSection: ITimetableCourseSection;
    readonly venue: ITimetableVenue | null;
}

/**
 * Represents a venue clash in a timetable.
 */
export interface IVenueClashTimetable
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: ITimetableVenue | null;
    readonly courseSections: ITimetableCourseSection[];
}

/**
 * Represents a course in a timetable.
 */
export type ITimetableCourse = Pick<ICourse, "code" | "name">;

/**
 * Represents a timetable venue.
 */
export type ITimetableVenue = Pick<IVenue, "shortName">;
