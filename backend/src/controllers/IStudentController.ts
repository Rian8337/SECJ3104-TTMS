import { IStudentSearchEntry, ITimetable } from "@/types";
import { Request, Response } from "express";
import { IController } from "./IController";

/**
 * A controller that is responsible for handling student-related operations.
 */
export interface IStudentController extends IController {
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
