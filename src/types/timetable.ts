import {
    ICourse,
    ICourseSectionSchedule,
    ILecturer,
    IVenue,
} from "@/database/schema";

interface IBaseTimetable extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: Pick<IVenue, "shortName"> | null;
}

/**
 * Represents a course section in a timetable.
 */
export interface ITimetableCourseSection {
    readonly section: string;
    readonly course: Pick<ICourse, "code" | "name">;
    readonly lecturer: Pick<ILecturer, "name"> | null;
}

/**
 * Represents a timetable.
 */
export interface ITimetable extends IBaseTimetable {
    readonly courseSection: ITimetableCourseSection;
}

/**
 * Represents a timetable clash.
 */
export interface ITimetableClash extends IBaseTimetable {
    readonly courseSections: ITimetableCourseSection[];
}
