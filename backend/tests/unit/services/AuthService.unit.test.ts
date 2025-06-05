import { ILecturer, IStudent } from "@/database/schema";
import {
    AuthService,
    FailedOperationResult,
    SuccessfulOperationResult,
} from "@/services";
import { mockLecturerRepository, mockStudentRepository } from "@test/mocks";

describe("AuthService (unit)", () => {
    let service: AuthService;

    beforeEach(() => {
        service = new AuthService(
            mockStudentRepository,
            mockLecturerRepository
        );
    });

    describe("login", () => {
        it("Should return 401 if user is not recognized", async () => {
            const result = (await service.login(
                "invalidUser",
                "password123"
            )) as FailedOperationResult;

            expect(result.isSuccessful()).toBe(false);
            expect(result.failed()).toBe(true);

            expect(result.status).toBe(401);
            expect(result.error).toBe("Invalid username or password.");
        });

        describe("Student login", () => {
            const mockStudent: IStudent = {
                matricNo: "C00EC0000",
                name: "John Doe",
                courseCode: "SECVH",
                facultyCode: "FC",
                kpNo: "123456789012",
            };

            it("Should return 401 if password is an invalid KP number", async () => {
                const result = (await service.login(
                    mockStudent.matricNo,
                    "invalidKP"
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).not.toHaveBeenCalled();

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if student not found", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(null);

                const result = (await service.login(
                    "C00EC0001",
                    mockStudent.kpNo
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith("C00EC0001");

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if password is incorrect", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(
                    mockStudent
                );

                const result = (await service.login(
                    mockStudent.matricNo,
                    "123456789011"
                )) as FailedOperationResult;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith(mockStudent.matricNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return student if login is successful", async () => {
                mockStudentRepository.getByMatricNo.mockResolvedValue(
                    mockStudent
                );

                const result = (await service.login(
                    mockStudent.matricNo,
                    mockStudent.kpNo
                )) as SuccessfulOperationResult<IStudent>;

                expect(
                    mockStudentRepository.getByMatricNo
                ).toHaveBeenCalledWith(mockStudent.matricNo);

                expect(result.isSuccessful()).toBe(true);
                expect(result.failed()).toBe(false);

                expect(result.status).toBe(200);
                expect(result.data).toEqual(mockStudent);
            });
        });

        describe("Lecturer login", () => {
            const mockLecturer: ILecturer = {
                workerNo: 12345,
                name: "John Doe",
            };

            it("Should return 401 if lecturer is not found", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    null
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    mockLecturer.workerNo.toString()
                )) as FailedOperationResult;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return 401 if password is incorrect", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    mockLecturer
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    "wrongPassword"
                )) as FailedOperationResult;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(false);
                expect(result.failed()).toBe(true);

                expect(result.status).toBe(401);
                expect(result.error).toBe("Invalid username or password.");
            });

            it("Should return lecturer if login is successful", async () => {
                mockLecturerRepository.getByWorkerNo.mockResolvedValueOnce(
                    mockLecturer
                );

                const result = (await service.login(
                    mockLecturer.workerNo.toString(),
                    mockLecturer.workerNo.toString()
                )) as SuccessfulOperationResult<ILecturer>;

                expect(
                    mockLecturerRepository.getByWorkerNo
                ).toHaveBeenCalledWith(mockLecturer.workerNo);

                expect(result.isSuccessful()).toBe(true);
                expect(result.failed()).toBe(false);

                expect(result.status).toBe(200);
                expect(result.data).toEqual(mockLecturer);
            });
        });
    });
});
