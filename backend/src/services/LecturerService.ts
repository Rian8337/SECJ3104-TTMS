import { ILecturer } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerRepository } from "@/repositories";
import {
    ITimetable,
    ITimetableClash,
    TTMSSemester,
    TTMSSession,
} from "@/types";
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
        private readonly lecturerRepository: ILecturerRepository
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

        const res = await this.lecturerRepository.getTimetable(
            workerNo,
            session,
            semester
        );

        return this.createSuccessfulResponse(res);
    }

    async getClashingTimetable(
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetableClash[]>> {
        const lecturer = await this.lecturerRepository.getByWorkerNo(workerNo);

        if (!lecturer) {
            return this.createFailedResponse("Lecturer not found", 404);
        }

        const timetables = await this.lecturerRepository.getClashingTimetable(
            workerNo,
            session,
            semester
        );

        if (timetables.length === 0) {
            return this.createSuccessfulResponse([]);
        }

        const clashes: ITimetableClash[] = [];

        for (const timetable of timetables) {
            const clash = clashes.find(
                (c) => c.day === timetable.day && c.time === timetable.time
            );

            if (clash) {
                clash.courseSections.push(timetable.courseSection);
            } else {
                clashes.push({
                    day: timetable.day,
                    time: timetable.time,
                    venue: timetable.venue,
                    courseSections: [timetable.courseSection],
                });
            }
        }

        return this.createSuccessfulResponse(clashes);
    }
}
