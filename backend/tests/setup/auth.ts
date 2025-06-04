import TestAgent from "supertest/lib/agent";
import { seededPrimaryData } from "./db";

const loginEndpoint = "/auth/login";

/**
 * Logins a test agent as a student.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginStudent(agent: TestAgent) {
    const student = seededPrimaryData.students[0];

    return agent.post(loginEndpoint).send({
        login: student.matricNo,
        password: student.kpNo,
    });
}

/**
 * Logins a test agent as a lecturer.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginLecturer(agent: TestAgent) {
    const lecturer = seededPrimaryData.lecturers[0];

    return agent.post(loginEndpoint).send({
        login: lecturer.workerNo.toString(),
        password: lecturer.workerNo.toString(),
    });
}
