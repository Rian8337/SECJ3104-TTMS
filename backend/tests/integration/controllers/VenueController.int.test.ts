import { CourseSectionScheduleDay, CourseSectionScheduleTime } from "@/types";
import {
    app,
    loginLecturer,
    loginStudent,
    seededPrimaryData,
} from "@test/setup";
import request from "supertest";

describe("VenueController (integration)", () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(() => {
        agent = request.agent(app);
    });

    describe("GET /venue/available-venues", () => {
        const endpoint = "/venue/available-venues";

        describe("Authentication", () => {
            it("Should return 401 if not authenticated", async () => {
                const res = await agent.get(endpoint);

                expect(res.status).toBe(401);
                expect(res.body).toEqual({
                    error: "Unauthorized",
                });
            });

            it("Should not return 401 for student requests", async () => {
                await loginStudent(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });

            it("Should not return 401 for lecturer requests", async () => {
                await loginLecturer(agent);

                const res = await agent.get(endpoint);

                expect(res.status).not.toBe(401);
            });
        });

        describe("Response", () => {
            const session = seededPrimaryData.sessions[0];

            beforeEach(async () => {
                await loginLecturer(agent);
            });

            it("Should return 400 if session is missing", async () => {
                const res = await agent.get(endpoint).query({
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: CourseSectionScheduleTime.time2.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Academic session is required.",
                });
            });

            it("Should return 400 if semester is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: CourseSectionScheduleTime.time2.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Semester is required.",
                });
            });

            it("Should return 400 if session format is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: "2023-2024",
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: [CourseSectionScheduleTime.time2.toString()],
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid session format. Expected format: YYYY/YYYY.",
                });
            });

            it("Should return 400 if semester is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: "4",
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: CourseSectionScheduleTime.time2.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid semester format. Expected format: 1, 2, or 3.",
                });
            });

            it("Should return 400 if day is missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    times: CourseSectionScheduleTime.time2.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Day is required",
                });
            });

            it("Should return 400 if times are missing", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Times are required",
                });
            });

            it("Should return 400 if day is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: "invalid-day",
                    times: CourseSectionScheduleTime.time2.toString(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid day. Valid value is between 1 and 7 (inclusive)",
                });
            });

            it("Should return 400 if time parsing results in an empty array", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: " ",
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "At least one time is required",
                });
            });

            it("Should return 400 if time parsing results in an array with more than 10 elements", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: Array(11)
                        .fill(0)
                        .map((_, i) => (i + 1).toString())
                        .join(),
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Too many times provided. Maximum is 10",
                });
            });

            it("Should return 400 if one of the times is invalid", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: `invalid-time,${CourseSectionScheduleTime.time2.toString()}`,
                });

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid time: NaN. Valid values are between 1 and 11 (inclusive)",
                });
            });

            it("Should return 200 with available venues", async () => {
                const res = await agent.get(endpoint).query({
                    session: session.session,
                    semester: session.semester,
                    day: CourseSectionScheduleDay.monday.toString(),
                    times: [
                        CourseSectionScheduleTime.time2.toString(),
                        CourseSectionScheduleTime.time3.toString(),
                    ].join(),
                });

                expect(res.status).toBe(200);
            });
        });
    });
});
