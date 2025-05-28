import { IStudent, IStudentRegisteredCourse } from "@/database/schema";

/**
 * Represents a search entry from a student search operation.
 */
export type IStudentSearchEntry = Pick<IStudent, "matricNo" | "name">;

export interface IRegisteredStudent
    extends Pick<IStudentRegisteredCourse, "courseCode" | "section"> {
    readonly student: Pick<IStudent, "matricNo" | "name" | "courseCode">;
}
