/**
 * Represents the days of the week for course section schedules.
 */
export enum CourseSectionScheduleDay {
    sunday = 1,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
}

/**
 * Represents the time of a course section schedule.
 */
export enum CourseSectionScheduleTime {
    /**
     * 7:00 - 7:50.
     */
    time1 = 1,

    /**
     * 8:00 - 8:50.
     */
    time2,

    /**
     * 9:00 - 9:50.
     */
    time3,

    /**
     * 10:00 - 10:50.
     */
    time4,

    /**
     * 11:00 - 11:50.
     */
    time5,

    /**
     * 12:00 - 12:50.
     */
    time6,

    /**
     * 13:00 - 13:50.
     */
    time7,

    /**
     * 14:00 - 14:50.
     */
    time8,

    /**
     * 15:00 - 15:50.
     */
    time9,

    /**
     * 16:00 - 16:50.
     */
    time10,

    /**
     * 17:00 - 17:50.
     */
    time11,
}

/**
 * Available sessions in the TTMS system.
 */
export type TTMSSession =
    | "2004/2005"
    | "2005/2006"
    | "2006/2007"
    | "2007/2008"
    | "2008/2009"
    | "2009/2010"
    | "2010/2011"
    | "2011/2012"
    | "2012/2013"
    | "2013/2014"
    | "2014/2015"
    | "2015/2016"
    | "2016/2017"
    | "2017/2018"
    | "2018/2019"
    | "2019/2020"
    | "2020/2021"
    | "2021/2022"
    | "2022/2023"
    | "2023/2024"
    | "2024/2025";

/**
 * Available semesters in the TTMS system.
 *
 * The third semester is considered a short semester.
 */
export type TTMSSemester = 1 | 2 | 3;

/**
 * Available course years in the TTMS system.
 */
export type TTMSCourseYear = 1 | 2 | 3 | 4;

/**
 * Available course codes in the TTMS system.
 */
export type TTMSCourseCode =
    | "SCS"
    | "SCSV"
    | "SCSD"
    | "SCSR"
    | "SCSB"
    | "SCSJ"
    | "SIDKI"
    | "SCSP"
    | "YASUH"
    | "SYED"
    | "SECJ"
    | "SECV"
    | "SECR"
    | "SECP"
    | "SECB"
    | "SECRH"
    | "SECVH"
    | "SECJH"
    | "SECPH"
    | "SECBH"
    | "MOHAM"
    | "ISSA"
    | "IBRAH"
    | "CHONG"
    | "HASSA"
    | "SCSEH"
    | "YUSRI"
    | "SCJ"
    | "SPS"
    | "SKB"
    | "SCB"
    | "SPL"
    | "SCR"
    | "SCV"
    | "SCI"
    | "SCD"
    | "ZULKH"
    | "SCK"
    | "XSCSJ"
    | "XSCSV"
    | "XSCSR"
    | "XSCSB"
    | "XSCSD"
    | "XSECJ"
    | "XSECR"
    | "XSECP"
    | "XSECB"
    | "XSCJ";

/**
 * Available faculty codes in the system.
 */
export type TTMSFacultyCode = "FSKSM" | "FC" | "FK";

/**
 * Types of venue available from the API.
 *
 * - `Makmal`: Laboratory
 * - `Bilik Kuliah`: Lecture Room
 * - `-:` Not specified
 */
export type TTMSVenueType = "Makmal" | "Bilik Kuliah" | "-";

export interface IAPIAuthentication {
    readonly session_id: string;
    readonly login_name: string;
    readonly description: string;
    readonly full_name: string;
}

export interface IAPISession {
    readonly sesi_semester_id: string;
    readonly semester: TTMSSemester;
    readonly tarikh_tamat: string;
    readonly sesi: TTMSSession;
    readonly tarikh_mula: string;
}

export interface IAPICourse {
    readonly kod_subjek: string;
    readonly nama_subjek: string;
    readonly domain: null;
    readonly bil_pensyarah: number;
    readonly bil_seksyen: number;
    readonly bil_pelajar: number;
}

export interface IAPIStudent {
    readonly nama: string;
    readonly tahun_kursus: TTMSCourseYear;
    readonly bil_subjek: number;
    readonly kod_fakulti: TTMSFacultyCode;
    readonly kod_kursus: TTMSCourseCode;
    readonly no_kp: string;
    readonly no_matrik: string;
}

export interface IAPILecturer {
    readonly nama: string;
    readonly bil_subjek: number;
    readonly no_pekerja: number;
    readonly bil_pelajar: number;
    readonly bil_seksyen: number;
}

export interface IAPICourseSection {
    readonly bil_seksyen: number;
    readonly bil_pelajar: number;
    readonly seksyen_list:
        | readonly {
              readonly pensyarah: string | null;
              readonly seksyen: string;
              readonly bil_pelajar: number;
          }[]
        | null;
    readonly kod_subjek: string;
    readonly nama_subjek: string;
    readonly bil_pensyarah: number | null;
}

export interface IAPISessionCourse {
    readonly kod_subjek: string;
    readonly seksyen: string;
    readonly status: string;
    readonly tahun_kursus: TTMSCourseYear;
    readonly sesi: TTMSSession;
    readonly nama_subjek: string;
    readonly semester: TTMSSemester;
    readonly kod_kursus: TTMSCourseCode;
}

export interface IAPICourseTimetable {
    readonly kod_subjek?: string;
    readonly ruang?: IAPICourseTimetableRoom;
    readonly masa?: CourseSectionScheduleTime;
    readonly hari?: CourseSectionScheduleDay;
    readonly seksyen?: string;
    readonly id_jws?: string;
}

export interface IAPICourseTimetableRoom {
    readonly kod_ruang: string;
    readonly nama_ruang: string;
    readonly nama_ruang_singkatan: string;
}

export interface IAPIFacultyRoom {
    readonly jenis: TTMSVenueType;
    readonly kod_fakulti: TTMSFacultyCode;
    readonly kod_ruang: string;
    readonly kapasiti: number;
    readonly nama_ruang_singkatan: string;
    readonly kod_jabatan: string;
    readonly nama_ruang: string;
}

export interface IAPICourseSectionStudent {
    readonly nama: string;
    readonly no_kp?: string;
    readonly kod_kursus?: string;
    readonly kod_fakulti: string;
    readonly tahun_kursus?: number;
    readonly status?: string;
}
