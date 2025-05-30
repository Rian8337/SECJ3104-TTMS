import { IStudent } from "@/database/schema";
import { Service } from "@/decorators/service";
import { dependencyTokens } from "@/dependencies/tokens";
import { IStudentRepository } from "@/repositories";
import {
    IStudentSearchEntry,
    ITimetable,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { convertRawTimetableToTimetable, isValidMatricNumber } from "@/utils";
import { inject } from "tsyringe";
import { BaseService } from "./BaseService";
import { IStudentService } from "./IStudentService";
import { OperationResult } from "./OperationResult";

/**
 * A service that is responsible for handling student-related operations.
 */
@Service(dependencyTokens.studentService)
export class StudentService extends BaseService implements IStudentService {
    constructor(
        @inject(dependencyTokens.studentRepository)
        private readonly studentRepository: IStudentRepository
    ) {
        super();
    }

    async getByMatricNo(matricNo: string): Promise<IStudent | null> {
        return this.studentRepository.getByMatricNo(matricNo);
    }

    async getTimetable(
        matricNo: string,
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<OperationResult<ITimetable[]>> {
        const student = await this.studentRepository.getByMatricNo(matricNo);

        if (!student) {
            return this.createFailedResponse("Student not found", 404);
        }

        const rawTimetables = await this.studentRepository.getTimetable(
            student.matricNo,
            session,
            semester
        );

        return this.createSuccessfulResponse(
            convertRawTimetableToTimetable(rawTimetables)
        );
    }

    async search(
        session: TTMSSession,
        semester: TTMSSemester,
        query: string,
        limit = 10,
        offset = 0
    ): Promise<OperationResult<IStudentSearchEntry[]>> {
        if (query.length < 3) {
            return this.createFailedResponse(
                "Query must be at least 3 characters long"
            );
        }

        let res: IStudentSearchEntry[];

        // Names cannot contain digits, so assume that matric numbers are being searched in that case
        if (/\d/.test(query)) {
            if (!isValidMatricNumber(query)) {
                return this.createSuccessfulResponse([]);
            }

            res = await this.studentRepository.searchByMatricNo(
                session,
                semester,
                query,
                limit,
                offset
            );
        } else {
            res = await this.studentRepository.searchByName(
                session,
                semester,
                query,
                limit,
                offset
            );
        }

        return this.createSuccessfulResponse(res);
    }
}
