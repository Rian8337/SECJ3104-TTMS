import { ILecturer } from "@/database/schema";
import { Controller } from "@/decorators/controller";
import { Roles } from "@/decorators/roles";
import { Get, Post } from "@/decorators/routes";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAuthService, ILecturerService } from "@/services";
import {
    ITimetable,
    ITimetableClash,
    TTMSSemester,
    TTMSSession,
    UserRole,
} from "@/types";
import { validateAcademicSession, validateSemester } from "@/utils";
import { Request, Response } from "express";
import { inject } from "tsyringe";
import { ILecturerController } from "./ILecturerController";
import { BaseController } from "./BaseController";

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
        private readonly lecturerService: ILecturerService,
        @inject(dependencyTokens.authService)
        private readonly authService: IAuthService
    ) {
        super();
    }

    @Post("/login")
    async login(
        req: Request<
            "/login",
            ILecturer | { error: string },
            Partial<{ login: string; password: string }>
        >,
        res: Response<ILecturer | { error: string }>
    ) {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({
                error: "Login and password are required.",
            });

            return;
        }

        const workerNo = parseInt(login);

        if (Number.isNaN(workerNo)) {
            res.status(400).json({ error: "Invalid login format." });

            return;
        }

        try {
            const lecturer = await this.lecturerService.getByWorkerNo(workerNo);

            if (lecturer?.workerNo.toString() !== password) {
                res.status(401).json({
                    error: "Invalid username or password.",
                });

                return;
            }

            this.authService.createSession(res, lecturer);

            res.json(lecturer);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error." });
        }
    }

    @Post("/logout")
    @Roles(UserRole.lecturer)
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
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetable[] | { error: string }>
    ) {
        const validatedData = this.validateRequest(req, res);

        if (!validatedData) {
            return;
        }

        const { session, semester, workerNo } = validatedData;

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

    @Get("/clashing-timetable")
    @Roles(UserRole.lecturer)
    async getClashingTimetable(
        req: Request<
            "/clashing-timetable",
            ITimetableClash[] | { error: string },
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<ITimetableClash[] | { error: string }>
    ): Promise<void> {
        const validatedData = this.validateRequest(req, res);

        if (!validatedData) {
            return;
        }

        const { session, semester, workerNo } = validatedData;

        try {
            const result = await this.lecturerService.getClashingTimetable(
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

    private validateRequest(
        req: Request<
            unknown,
            { error: string },
            unknown,
            Partial<{ session: string; semester: string; worker_no: string }>
        >,
        res: Response<{ error: string }>
    ): {
        session: TTMSSession;
        semester: TTMSSemester;
        workerNo: number;
    } | null {
        const { session, semester, worker_no: workerNo } = req.query;

        if (!session) {
            res.status(400).json({ error: "Academic session is required." });

            return null;
        }

        if (!semester) {
            res.status(400).json({ error: "Semester is required." });

            return null;
        }

        if (!workerNo) {
            res.status(400).json({ error: "Worker number is required." });

            return null;
        }

        const parsedWorkerNo = parseInt(workerNo);

        if (Number.isNaN(parsedWorkerNo)) {
            res.status(400).json({ error: "Invalid worker number format." });

            return null;
        }

        if (!validateAcademicSession(session)) {
            res.status(400).json({
                error: "Invalid session format. Expected format: YYYY/YYYY.",
            });

            return null;
        }

        const parsedSemester = parseInt(semester);

        if (!validateSemester(parsedSemester)) {
            res.status(400).json({
                error: "Invalid semester format. Expected format: 1, 2, or 3.",
            });

            return null;
        }

        return {
            session,
            semester: parsedSemester,
            workerNo: parsedWorkerNo,
        };
    }
}
