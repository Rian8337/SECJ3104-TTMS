import {
    ICourse,
    ICourseSectionSchedule,
    ILecturer,
    IVenue,
} from "@/database/schema";

/**
 * Represents a timetable.
 */
export interface ITimetable
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: Pick<IVenue, "shortName"> | null;
    readonly courseSection: {
        readonly section: string;
        readonly course: Pick<ICourse, "code" | "name">;
        readonly lecturer: Pick<ILecturer, "name"> | null;
    };
}
