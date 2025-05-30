import { ILecturer } from "@/database/schema";
import { ITimetable, ITimetableVenueClash } from "@/types";
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
    getVenueClash(
        req: Request<
            "/venue-clash",
            unknown,
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetableVenueClash[] | { error: string }>
    ): Promise<void>;

    /**
     * Searches for lecturers by their name.
     *
     * @param req The request object.
     * @param res The response object.
     */
    search(
        req: Request<
            "/search",
            unknown,
            unknown,
            Partial<{
                session: string;
                semester: string;
                query: string;
                limit: string;
                offset: string;
            }>
        >,
        res: Response<ILecturer[] | { error: string }>
    ): Promise<void>;
}
