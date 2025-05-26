import { IStudent } from "@/database/schema";
import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAuthService, IStudentService } from "@/services";
import { IStudentSearchEntry, ITimetable, UserRole } from "@/types";
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
        private readonly studentService: IStudentService,
        @inject(dependencyTokens.authService)
        private readonly authService: IAuthService
    ) {
        super();
    }

    @Post("/login")
    async login(
        req: Request<
            "/login",
            IStudent | { error: string },
            Partial<{ login: string; password: string }>
        >,
        res: Response<IStudent | { error: string }>
    ) {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ error: "Login and password are required" });

            return;
        }

        try {
            const student = await this.studentService.getByMatricNo(login);

            if (student?.kpNo !== password) {
                res.status(401).json({ error: "Invalid username or password" });

                return;
            }

            this.authService.createSession(res, student);

            res.json(student);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }

    @Post("/logout")
    @Roles(UserRole.student)
    logout(_: Request<"/logout">, res: Response) {
        this.authService.clearSession(res);

        res.sendStatus(200);
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

    @Get("/search")
    @Roles(UserRole.student, UserRole.lecturer)
    async search(
        req: Request<
            "/search",
            IStudentSearchEntry[] | { error: string },
            unknown,
            Partial<{ query: string; limit: string; offset: string }>
        >,
        res: Response<IStudentSearchEntry[] | { error: string }>
    ) {
        const { query, limit, offset } = req.query;

        if (!query) {
            res.status(400).json({ error: "Query is required" });

            return;
        }

        const parsedLimit = parseInt(limit ?? "10");
        const parsedOffset = parseInt(offset ?? "0");

        if (Number.isNaN(parsedLimit) || parsedLimit < 0) {
            res.status(400).json({ error: "Invalid limit" });

            return;
        }

        if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
            res.status(400).json({ error: "Invalid offset" });

            return;
        }

        try {
            const result = await this.studentService.search(
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
