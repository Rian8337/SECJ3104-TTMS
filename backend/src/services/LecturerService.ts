import { ILecturer } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerRepository, IVenueRepository } from "@/repositories";
import {
    ITimetable,
    IVenueClashTimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import {
    convertRawTimetableToTimetable,
    convertRawVenueClashTimetableToVenueClashTimetable,
} from "@/utils";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { ILecturerService } from "./ILecturerService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling lecturer-related operations.
 */
@Service(dependencyTokens.lecturerService)
export class LecturerService extends BaseService implements ILecturerService {
    constructor(
        @inject(dependencyTokens.lecturerRepository)
        private readonly lecturerRepository: ILecturerRepository,
        @inject(dependencyTokens.venueRepository)
        private readonly venueRepository: IVenueRepository
    ) {
        super();
    }

    getByWorkerNo(workerNo: number): Promise<ILecturer | null> {
        return this.lecturerRepository.getByWorkerNo(workerNo);
    }

    async getTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetable[]>> {
        const lecturer = await this.lecturerRepository.getByWorkerNo(workerNo);

        if (!lecturer) {
            return this.createFailedResponse("Lecturer not found", 404);
        }

        const rawTimetables = await this.lecturerRepository.getTimetable(
            workerNo,
            session,
            semester
        );

        return this.createSuccessfulResponse(
            convertRawTimetableToTimetable(rawTimetables)
        );
    }

    async getVenueClashes(
        session: TTMSSession,
        semester: TTMSSemester,
        workerNo: number
    ): Promise<OperationResult<IVenueClashTimetable[]>> {
        const lecturer = await this.lecturerRepository.getByWorkerNo(workerNo);

        if (!lecturer) {
            return this.createFailedResponse("Lecturer not found", 404);
        }

        const rawTimetables = await this.venueRepository.getVenueClashes(
            session,
            semester,
            workerNo
        );

        const timetables =
            convertRawVenueClashTimetableToVenueClashTimetable(rawTimetables);

        return this.createSuccessfulResponse(timetables);
    }

    async search(
        session: TTMSSession,
        semester: TTMSSemester,
        query: string,
        limit?: number,
        offset?: number
    ): Promise<OperationResult<ILecturer[]>> {
        if (query.length < 3) {
            return this.createFailedResponse(
                "Query must be at least 3 characters long"
            );
        }

        const res = await this.lecturerRepository.searchByName(
            session,
            semester,
            query,
            limit,
            offset
        );

        return this.createSuccessfulResponse(res);
    }
}
