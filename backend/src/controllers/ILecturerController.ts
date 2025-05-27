import { ITimetable, ITimetableClash } from "@/types";
import { Request, Response } from "express";
import { IController } from "./IController";

/**
 * A controller that is responsible for handling lecturer-related operations.
 */
export interface ILecturerController extends IController {
    /**
     * Obtains a lecturer's timetable by their worker number.
     *
     * @param req The request object.
     * @param res The response object.
     */
    getTimetable(
        req: Request<
            "/timetable",
            unknown,
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetable[] | { error: string }>
    ): Promise<void>;

    /**
     * Obtains the timetables that clash with a lecturer's timetable.
     *
     * @param req The request object.
     * @param res The response object.
     */
    getClashingTimetable(
        req: Request<
            "/clashing-timetable",
            unknown,
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetableClash[] | { error: string }>
    ): Promise<void>;
}
