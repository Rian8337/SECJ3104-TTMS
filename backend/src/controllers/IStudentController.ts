import { IStudent } from "@/database/schema";
import { IStudentSearchEntry, ITimetable } from "@/types";
import { Request, Response } from "express";

/**
 * A controller that is responsible for handling student-related operations.
 */
export interface IStudentController {
    /**
     * Logins a student into the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    login(
        req: Request<
            "/login",
            unknown,
            Partial<{ login: string; password: string }>
        >,
        res: Response<IStudent | { error: string }>
    ): Promise<void>;

    /**
     * Logs out a student from the system.
     *
     * @param req The request object.
     * @param res The response object.
     */
    logout(req: Request<"/logout">, res: Response): void;

    /**
     * Obtains a student's timetable by their matriculation number.
     *
     * @param req The request object.
     * @param res The response object.
     */
    getTimetable(
        req: Request<
            "/timetable",
            unknown,
            unknown,
            Partial<{ session: string; semester: string; matric_no: string }>
        >,
        res: Response<ITimetable[] | { error: string }>
    ): Promise<void>;

    /**
     * Searches for students by their matriculation number or name.
     *
     * @param req The request object.
     * @param res The response object.
     */
    search(
        req: Request<"/search", unknown, unknown, Partial<{ query: string }>>,
        res: Response<IStudentSearchEntry[] | { error: string }>
    ): Promise<void>;
}
