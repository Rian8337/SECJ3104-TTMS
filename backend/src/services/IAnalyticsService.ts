import { IAnalytics, TTMSSemester, TTMSSession } from "@/types";
import { OperationResult } from "./OperationResult";
import { IService } from "./IService";

/**
 * A service that is responsible for handling analytics-related operations.
 */
export interface IAnalyticsService extends IService {
    /**
     * Generates analytics for students in a given academic session and semester.
     *
     * @param session The academic session to generate analytics for.
     * @param semester The academic semester to generate analytics for.
     * @return The analytics for students in the given session and semester.
     */
    generate(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<IAnalytics>>;
}
