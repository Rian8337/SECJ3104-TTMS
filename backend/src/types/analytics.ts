import {
    ICourse,
    ICourseSection,
    ICourseSectionSchedule,
    IStudent,
    IVenue,
} from "@/database/schema";
import { TTMSCourseCode } from "./ttms";

/**
 * Represents analytics data for students in an academic session and semester.
 */
export interface IStudentAnalytics {
    readonly activeStudents: number;
    readonly backToBackStudents: IStudentAnalyticsBackToBackStudent[];
    readonly clashingStudents: IStudentAnalyticsClashingStudent[];
    readonly departments: IStudentAnalyticsDepartment[];
}

/**
 * Represent a department in student analytics.
 */
export interface IStudentAnalyticsDepartment {
    readonly code: TTMSCourseCode;
    totalStudents: number;
    totalClashes: number;
    totalBackToBack: number;
}

/**
 * Base type for student analytics that includes basic student information.
 */
export type IBaseStudentAnalyticsStudent = Pick<
    IStudent,
    "matricNo" | "name" | "courseCode"
>;

/**
 * Represents a student with back-to-back schedules in analytics.
 */
export interface IStudentAnalyticsBackToBackStudent
    extends IBaseStudentAnalyticsStudent {
    readonly schedules: IStudentAnalyticsCourseSchedule[][];
}

/**
 * Represents a student with clashing schedules in analytics.
 */
export interface IStudentAnalyticsClashingStudent
    extends IBaseStudentAnalyticsStudent {
    readonly clashes: IStudentAnalyticsScheduleClash[];
}

/**
 * Represents a course with its sections and schedules for analytics purposes.
 */
export interface IStudentAnalyticsCourse
    extends Pick<ICourseSection, "section"> {
    readonly course: Pick<ICourse, "code" | "name">;
    readonly schedules: IStudentAnalyticsCourseSchedule[];
}

/**
 * Represents a group of clashing courses for a student in analytics.
 */
export interface IStudentAnalyticsScheduleClash
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly courses: IStudentAnalyticsScheduleClashCourse[];
}

/**
 * Represents a clashing course for a student in analytics.
 */
export interface IStudentAnalyticsScheduleClashCourse {
    readonly course: Pick<ICourse, "code" | "name">;
    readonly section: string;
    readonly venue: Pick<IVenue, "shortName"> | null;
}

/**
 * Represents a course schedule for a student in analytics.
 */
export interface IStudentAnalyticsCourseSchedule
    extends Pick<ICourseSectionSchedule, "day" | "time"> {
    readonly venue: Pick<IVenue, "shortName"> | null;
}
