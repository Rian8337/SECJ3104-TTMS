import { FailedOperationResult, LecturerService } from "@/services";
import { mockLecturerRepository, mockVenueRepository } from "@test/mocks";

describe("LecturerService (unit)", () => {
    let service: LecturerService;

    beforeEach(() => {
        service = new LecturerService(
            mockLecturerRepository,
            mockVenueRepository
        );
    });

    it("[getByWorkerNo] should get a lecturer by worker number from repository", async () => {
        await service.getByWorkerNo(123456);

        expect(mockLecturerRepository.getByWorkerNo).toHaveBeenCalledWith(
            123456
        );
    });

    it("[search] Should return error if query is less than 3 characters", async () => {
        const result = (await service.search(
            "2023/2024",
            1,
            "ab"
        )) as FailedOperationResult;

        expect(result.isSuccessful()).toBe(false);
        expect(result.failed()).toBe(true);

        expect(result.status).toBe(400);
        expect(result.error).toBe("Query must be at least 3 characters long");
    });
});
