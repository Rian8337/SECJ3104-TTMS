import { Request, Response } from "express";
import { IController } from "./IController";
import { IAnalytics } from "@/types";

/**
 * A controller that is responsible for handling analytics-related operations.
 */
export interface IAnalyticsController extends IController {
    /**
     * Generates analytics in a given academic session and semester.
     *
     * @param req The request object.
     * @param res The response object.
     */
    generate(
        req: Request<
            "/generate",
            IAnalytics | { error: string },
            unknown,
            Partial<{ session: string; semester: string }>
        >,
        res: Response<IAnalytics | { error: string }>
    ): Promise<void>;
}
