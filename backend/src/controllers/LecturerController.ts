import { ILecturer } from "@/database/schema";
import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerService } from "@/services";
import { ITimetable, IVenueClashTimetable, UserRole } from "@/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";

/**
 * A controller that is responsible for handling lecturer-related operations.
 */
@Controller("/lecturer")
export class LecturerController extends BaseController {
    constructor(
        @inject(dependencyTokens.lecturerService)
        private readonly lecturerService: ILecturerService
    ) {
        super();
    }

    /**
     * Obtains a lecturer's timetable by their worker number.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Get("/timetable")
    @Roles(UserRole.student, UserRole.lecturer)
    async getTimetable(
        req: Request<
            "/timetable",
            ITimetable[] | { error: string },
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetable[] | { error: string }>
    ) {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const workerNo = this.validateWorkerNo(req, res);

        if (workerNo === null) {
            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.lecturerService.getTimetable(
                workerNo,
                session,
                semester
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Obtains the timetables that clash with a lecturer's timetable.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Get("/venue-clash")
    @Roles(UserRole.lecturer)
    async getVenueClash(
        req: Request<
            "/venue-clash",
            IVenueClashTimetable[] | { error: string },
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<IVenueClashTimetable[] | { error: string }>
    ): Promise<void> {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const workerNo = this.validateWorkerNo(req, res);

        if (workerNo === null) {
            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.lecturerService.getVenueClashes(
                session,
                semester,
                workerNo
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Searches for lecturers by their name.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Get("/search")
    @Roles(UserRole.student, UserRole.lecturer)
    async search(
        req: Request<
            "/search",
            ILecturer[] | { error: string },
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
    ) {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const { session, semester } = validatedSessionAndSemester;
        const { query, limit, offset } = req.query;

        if (!query) {
            res.status(400).json({ error: "Query is required." });

            return;
        }

        const parsedLimit = parseInt(limit ?? "10");
        const parsedOffset = parseInt(offset ?? "0");

        if (Number.isNaN(parsedLimit) || Number.isNaN(parsedOffset)) {
            res.status(400).json({ error: "Invalid pagination parameters." });

            return;
        }

        try {
            const result = await this.lecturerService.search(
                session,
                semester,
                query,
                parsedLimit,
                parsedOffset
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    private validateWorkerNo(
        req: Request<
            unknown,
            { error: string },
            unknown,
            Partial<{ worker_no: string }>
        >,
        res: Response<{ error: string }>
    ): number | null {
        const { worker_no: workerNo } = req.query;

        if (!workerNo) {
            res.status(400).json({ error: "Worker number is required." });

            return null;
        }

        const parsedWorkerNo = parseInt(workerNo);

        if (Number.isNaN(parsedWorkerNo)) {
            res.status(400).json({ error: "Invalid worker number format." });

            return null;
        }

        return parsedWorkerNo;
    }
}
