import { IAnalytics, UserRole } from "@/types";
import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { IAnalyticsController } from "./IAnalyticsController";
import { Controller } from "@/decorators/controller";
import { Get } from "@/decorators/routes";
import { Roles } from "@/decorators/roles";
import { inject } from "tsyringe";
import { dependencyTokens } from "@/dependencies/tokens";
import { IAnalyticsService } from "@/services";

/**
 * A controller that is responsible for handling analytics-related operations.
 */
@Controller("/analytics")
export class AnalyticsController
    extends BaseController
    implements IAnalyticsController
{
    constructor(
        @inject(dependencyTokens.analyticsService)
        private readonly analyticsService: IAnalyticsService
    ) {
        super();
    }

    @Get("/generate")
    @Roles(UserRole.lecturer)
    async generate(
        req: Request<
            "/generate",
            IAnalytics | { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<IAnalytics | { error: string }>
    ) {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const result = await this.analyticsService.generate(
                session,
                semester
            );

            this.respondWithOperationResult(res, result);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }
}
