import { Controller } from "@/decorators/controller";
import { BaseController } from "./BaseController";
import { inject } from "tsyringe";
import { dependencyTokens } from "@/dependencies/tokens";
import { IVenueService } from "@/services";
import { Get } from "@/decorators/routes";
import { Request, Response } from "express";
import { IVenue } from "@/database/schema";
import { isValidTimetableDay, isValidTimetableTime } from "@/utils";
import { Roles } from "@/decorators/roles";
import { UserRole } from "@/types";

/**
 * A controller that is responsible for handling venue-related operations.
 */
@Controller("/venue")
export class VenueController extends BaseController {
    constructor(
        @inject(dependencyTokens.venueService)
        private readonly venueService: IVenueService
    ) {
        super();
    }

    /**
     * Obtains a list of available venues based on the provided session,
     * semester, day, start time, and end time.
     *
     * @param req The request object.
     * @param res The response object.
     */
    @Get("/available-venues")
    @Roles(UserRole.student, UserRole.lecturer)
    async getAvailableVenues(
        req: Request<
            "/available-venues",
            IVenue[] | { error: string },
            unknown,
            Partial<{
                session: string;
                semester: string;
                day: string;
                times: string;
            }>
        >,
        res: Response<IVenue[] | { error: string }>
    ) {
        const validatedSessionAndSemester = this.validateSessionSemester(
            req,
            res
        );

        if (!validatedSessionAndSemester) {
            return;
        }

        const { day, times } = req.query;

        if (!day) {
            res.status(400).json({ error: "Day is required" });

            return;
        }

        if (!times) {
            res.status(400).json({ error: "Times are required" });

            return;
        }

        const parsedDay = parseInt(day);

        if (!isValidTimetableDay(parsedDay)) {
            res.status(400).json({
                error: "Invalid day. Valid value is between 1 and 7 (inclusive)",
            });

            return;
        }

        const parsedTimes = Array.from(
            new Set(
                times
                    .trim()
                    .split(",")
                    .map((t) => parseInt(t.trim(), 10))
            )
        );

        if (parsedTimes.length === 0) {
            res.status(400).json({ error: "At least one time is required" });

            return;
        }

        if (parsedTimes.length > 10) {
            res.status(400).json({
                error: "Too many times provided. Maximum is 10",
            });

            return;
        }

        for (const time of parsedTimes) {
            if (!isValidTimetableTime(time)) {
                res.status(400).json({
                    error: `Invalid time: ${time.toString()}. Valid values are between 1 and 11 (inclusive)`,
                });

                return;
            }
        }

        const { session, semester } = validatedSessionAndSemester;

        try {
            const venues = await this.venueService.getAvailableVenues(
                session,
                semester,
                parsedDay,
                parsedTimes
            );

            res.json(venues);
        } catch (e) {
            console.error(e);

            res.status(500).json({ error: "Internal server error" });
        }
    }
}
