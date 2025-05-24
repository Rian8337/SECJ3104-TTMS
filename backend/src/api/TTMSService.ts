import {
    IAPIAuthentication,
    IAPICourse,
    IAPICourseSection,
    IAPICourseSectionStudent,
    IAPICourseTimetable,
    IAPIFacultyRoom,
    IAPILecturer,
    IAPISession,
    IAPISessionCourse,
    IAPIStudent,
    TTMSFacultyCode,
    TTMSSemester,
    TTMSSession,
} from "@/types";
import { APIService } from "./APIService";

/**
 * API service for TTMS.
 */
export class TTMSService extends APIService {
    override get host(): URL {
        if (!process.env.TTMS_UPSTREAM_HOST) {
            throw new Error(
                "TTMS_UPSTREAM_HOST environment variable is not set"
            );
        }

        return new URL(process.env.TTMS_UPSTREAM_HOST);
    }

    async login(
        username: string,
        password: string
    ): Promise<IAPIAuthentication | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "authentication");
        searchParams.append("login", username);
        searchParams.append("password", password);

        return this.fetchJSON<IAPIAuthentication[]>(host).then(
            (res) => res?.[0] ?? null
        );
    }

    async elevateSession(sessionId: string): Promise<string | null> {
        const host = new URL("http://web.fc.utm.my/ttms/auth-admin.php");

        host.searchParams.append("session_id", sessionId);

        return this.fetchJSON<{ session_id: string }[]>(host).then(
            (res) => res?.[0]?.session_id ?? null
        );
    }

    async fetchSessions(): Promise<IAPISession[] | null> {
        const { host } = this;

        host.searchParams.append("entity", "sesisemester");

        return this.fetchJSON<IAPISession[]>(host);
    }

    async fetchCourses(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IAPICourse[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "subjek");
        searchParams.append("sesi", session);
        searchParams.append("semester", semester.toString());

        return this.fetchJSON<IAPICourse[]>(host);
    }

    async fetchStudents(options: {
        sessionId: string;
        session: TTMSSession;
        semester: TTMSSemester;
        limit?: number;
        offset?: number;
    }): Promise<IAPIStudent[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "pelajar");
        searchParams.append("session_id", options.sessionId);
        searchParams.append("sesi", options.session);
        searchParams.append("semester", options.semester.toString());
        searchParams.append("limit", options.limit?.toString() ?? "50");
        searchParams.append("offset", options.offset?.toString() ?? "0");

        return this.fetchJSON<IAPIStudent[]>(host);
    }

    async fetchLecturers(options: {
        sessionId: string;
        session: TTMSSession;
        semester: TTMSSemester;
    }): Promise<IAPILecturer[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "pensyarah");
        searchParams.append("session_id", options.sessionId);
        searchParams.append("sesi", options.session);
        searchParams.append("semester", options.semester.toString());

        return this.fetchJSON<IAPILecturer[]>(host);
    }

    async fetchCourseSections(
        session: TTMSSession,
        semester: TTMSSemester
    ): Promise<IAPICourseSection[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "subjek_seksyen");
        searchParams.append("sesi", session);
        searchParams.append("semester", semester.toString());

        return this.fetchJSON<IAPICourseSection[]>(host);
    }

    async fetchStudentCourses(
        matricNo: string
    ): Promise<IAPISessionCourse[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "pelajar_subjek");
        searchParams.append("no_matrik", matricNo);

        return this.fetchJSON<IAPISessionCourse[]>(host);
    }

    async fetchRooms(
        facultyCode: TTMSFacultyCode,
        roomSearch?: string
    ): Promise<IAPIFacultyRoom[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "ruang");
        searchParams.append("kod_fakulti", facultyCode);

        if (roomSearch) {
            searchParams.append("kod_ruang_like", roomSearch);
        }

        return this.fetchJSON<IAPIFacultyRoom[]>(host);
    }

    async fetchCourseTimetable(options: {
        session: TTMSSession;
        semester: TTMSSemester;
        courseCode?: string;
        section?: string;
    }): Promise<IAPICourseTimetable[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "jadual_subjek");
        searchParams.append("sesi", options.session);
        searchParams.append("semester", options.semester.toString());

        if (options.courseCode) {
            searchParams.append("kod_subjek", options.courseCode);
        }

        if (options.section) {
            searchParams.append("seksyen", options.section);
        }

        return this.fetchJSON<IAPICourseTimetable[]>(host);
    }

    async fetchStudentsInSection(options: {
        sessionId: string;
        session: TTMSSession;
        semester: TTMSSemester;
        courseCode: string;
        section: string;
    }): Promise<IAPICourseSectionStudent[] | null> {
        const { host } = this;
        const { searchParams } = host;

        searchParams.append("entity", "subjek_pelajar");
        searchParams.append("session_id", options.sessionId);
        searchParams.append("sesi", options.session);
        searchParams.append("semester", options.semester.toString());
        searchParams.append("kod_subjek", options.courseCode);
        searchParams.append("seksyen", options.section);

        return this.fetchJSON<IAPICourseSectionStudent[]>(host);
    }
}
