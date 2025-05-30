import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IStudentService } from "@/services";
import {
    IStudentAnalytics,
    IStudentSearchEntry,
    ITimetable,
    UserRole,
} from "@/types";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { BaseController } from "./BaseController";
import { IStudentController } from "./IStudentController";

/**
 * A controller that is responsible for handling student-related operations.
 */
@Controller("/student")
export class StudentController
    extends BaseController
    implements IStudentController
{
    constructor(
        @inject(dependencyTokens.studentService)
        private readonly studentService: IStudentService
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
            Partial<{ session: string; semester: string; matric_no: string }>
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

        const { matric_no: matricNo } = req.query;

        if (!matricNo) {
            res.status(400).json({ error: "Matric number is required." });

            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.studentService.getTimetable(
                matricNo,
                session,
                semester
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    @Get("/analytics")
    @Roles(UserRole.lecturer)
    async getAnalytics(
        req: Request<
            "/analytics",
            IStudentAnalytics | { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<IStudentAnalytics | { error: string }>
    ): Promise<void> {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.studentService.generateAnalytics(
                session,
                semester
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    @Get("/search")
    @Roles(UserRole.student, UserRole.lecturer)
    async search(
        req: Request<
            "/search",
            IStudentSearchEntry[] | { error: string },
            unknown,
            Partial<{
                session: string;
                semester: string;
                query: string;
                limit: string;
                offset: string;
            }>
        >,
        res: Response<IStudentSearchEntry[] | { error: string }>
    ) {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const { query, limit, offset } = req.query;

        if (!query) {
            res.status(400).json({ error: "Query is required" });

            return;
        }

        const parsedLimit = parseInt(limit ?? "10");
        const parsedOffset = parseInt(offset ?? "0");

        if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
            res.status(400).json({ error: "Invalid limit" });

            return;
        }

        if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
            res.status(400).json({ error: "Invalid offset" });

            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.studentService.search(
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
}
