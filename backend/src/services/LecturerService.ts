import { ILecturer } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { ILecturerRepository } from "@/repositories";
import {
    ITimetable,
    ITimetableVenueClash,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { convertRawTimetableToTimetable } from "@/utils";
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
        workerNo: number,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetableVenueClash[]>> {
        const lecturer = await this.lecturerRepository.getByWorkerNo(workerNo);

        if (!lecturer) {
            return this.createFailedResponse("Lecturer not found", 404);
        }

        const timetables = await this.lecturerRepository.getVenueClashes(
            workerNo,
            session,
            semester
        );

        if (timetables.length === 0) {
            return this.createSuccessfulResponse([]);
        }

        const clashes = new Map<string, ITimetableVenueClash>();

        for (const timetable of timetables) {
            const key = `${timetable.scheduleDay.toString()}-${timetable.scheduleTime.toString()}-${timetable.scheduleVenue!}`;

            if (!clashes.has(key)) {
                clashes.set(key, {
                    day: timetable.scheduleDay,
                    time: timetable.scheduleTime,
                    venue: { shortName: timetable.scheduleVenue! },
                    courseSections: [],
                });
            }

            const clash = clashes.get(key)!;

            clash.courseSections.push({
                section: timetable.section,
                course: {
                    code: timetable.courseCode,
                    name: timetable.courseName,
                },
                lecturer:
                    timetable.lecturerNo !== null &&
                    timetable.lecturerName !== null
                        ? {
                              workerNo: timetable.lecturerNo,
                              name: timetable.lecturerName,
                          }
                        : null,
            });
        }

        return this.createSuccessfulResponse(Array.from(clashes.values()));
    }
}
