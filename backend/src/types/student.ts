import { IStudent } from "@/database/schema";

/**
 * Represents a search entry from a student search operation.
 */
export type IStudentSearchEntry = Pick<IStudent, "matricNo" | "name">;
