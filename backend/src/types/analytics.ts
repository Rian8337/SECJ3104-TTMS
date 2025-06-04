import {
    ICourse,
    ICourseSection,
    ICourseSectionSchedule,
    IStudent,
    IVenue,
} from "@/database/schema";
import { TTMSCourseCode } from "./ttms";
import { IVenueClashTimetable } from "./timetable";

/**
 * Represents analytics data in an academic session and semester.
 */
export interface IAnalytics {
    readonly activeStudents: number;
    readonly backToBackStudents: IAnalyticsBackToBackStudent[];
    readonly clashingStudents: IAnalyticsClashingStudent[];
    readonly departments: IAnalyticsStudentDepartment[];
    readonly venueClashes: IVenueClashTimetable[];
}

/**
 * Represent a student department analytics.
 */
export interface IAnalyticsStudentDepartment {
    readonly code: TTMSCourseCode;
    totalStudents: number;
    totalClashes: number;
    totalBackToBack: number;
}

/**
 * Base type for a student in analytics that includes basic student information.
 */
export type IBaseAnalyticsStudent = Pick<
    IStudent,
    "matricNo" | "name" | "courseCode"
>;

/**
 * Represents a student with back-to-back schedules in analytics.
 */
export interface IAnalyticsBackToBackStudent extends IBaseAnalyticsStudent {
    readonly schedules: IAnalyticsBackToBackSchedule[][];
}

/**
 * Represents a student with clashing schedules in analytics.
 */
export interface IAnalyticsClashingStudent extends IBaseAnalyticsStudent {
    readonly clashes: IAnalyticsScheduleClash[];
}

/**
 * Represents a course with its sections and schedules for analytics purposes.
 */
export interface IAnalyticsCourse extends Pick<ICourseSection, "section"> {
    readonly course: Pick<ICourse, "code" | "name">;
    readonly schedules: IAnalyticsCourseSchedule[];
}

/**
 * Represents a group of clashing courses for a student in analytics.
 */
export interface IAnalyticsScheduleClash
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly courses: IAnalyticsScheduleClashCourse[];
}

export interface IAnalyticsBackToBackSchedule
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly course: Pick<ICourse, "code" | "name">;
    readonly section: string;
    readonly venue: Pick<IVenue, "shortName"> | null;
}

/**
 * Represents a clashing course for a student in analytics.
 */
export interface IAnalyticsScheduleClashCourse {
    readonly course: Pick<ICourse, "code" | "name">;
    readonly section: string;
    readonly venue: Pick<IVenue, "shortName"> | null;
}

/**
 * Represents a course schedule for a student in analytics.
 */
export interface IAnalyticsCourseSchedule
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: Pick<IVenue, "shortName"> | null;
}
