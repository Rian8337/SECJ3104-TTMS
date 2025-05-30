import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerService } from "@/services";
import { ITimetable, ITimetableVenueClash, UserRole } from "@/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import { ILecturerController } from "./ILecturerController";

/**
 * A controller that is responsible for handling lecturer-related operations.
 */
@Controller("/lecturer")
export class LecturerController
    extends BaseController
    implements ILecturerController
{
    constructor(
        @inject(dependencyTokens.lecturerService)
        private readonly lecturerService: ILecturerService
    ) {
        super();
    }

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

    @Get("/venue-clash")
    @Roles(UserRole.lecturer)
    async getVenueClash(
        req: Request<
            "/venue-clash",
            ITimetableVenueClash[] | { error: string },
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetableVenueClash[] | { error: string }>
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
