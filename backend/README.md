# Timetable Management System Backend

The backend for SECJ3104 Applications Development Timetable Management System.

## Running

### Requirements

To run the project, you need the following programs:

- [Node.js](https://nodejs.org) version 18 or later
- [MySQL](https://www.mysql.com/) version 8 or later

Install dependencies by opening your terminal, navigating to the root folder of this project, and executing the following command:

```sh
$ npm i
```

### Environment File

Create an unnamed environment (`.env`) file at the root of this project and fill it with the following:

```sh
DB_HOST= # The host of the MySQL database
DB_USER= # The username to login to the MySQL database
DB_PASSWORD= # The password to login to the MySQL database
DB_NAME= # The name of the database to use
SCRAPER_MATRIC_NO= # The matric number for scraping data from upstream API
SCRAPER_PASSWORD= # The password for scraping data from upstream API
COOKIE_SECRET= # The secret that will be used to sign cookies (required)
SESSION_ENCRYPTION_KEY= # The key that will be used to encrypt user sessions (required)
TTMS_UPSTREAM_HOST= # The host of the upstream API. Only required for data scraping
SERVER_PORT= # The port the server will listen on. Defaults to 3001
```

All database environment variables default to the values that your database management system employs.

To generate a cookie secret, execute the following command:

```sh
$ node -e "console.log(require('crypto').randomUUID())"
```

For session encryption key:

```sh
$ node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output of the commands to the environment file above.

### Generating Database Tables

Create the database in the MySQL database management system using the same database name that you used in the environment file, and execute the following command:

```sh
$ npx drizzle-kit push
```

### Running Server

Execute the following command:

```sh
$ npm start
```

# Endpoints

These are the endpoints that are provided by the backend.

For all endpoints, unless otherwise specified, non-2xx responses will return the following JSON schema:

```jsonc
{
    "error": "", // The error message
}
```

| Name                                                                  | Description                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------- |
| [POST `/auth/login`](#post-authlogin)                                 | Logs a user into the server                                   |
| [POST `/auth/logout`](#post-authlogout)                               | Logs a user out                                               |
| [GET `/student/timetable`](#get-studenttimetable)                     | Obtains a student's timetable                                 |
| [GET `/student/search`](#get-studentsearch)                           | Searches for students                                         |
| [GET `/lecturer/timetable`](#get-lecturertimetable)                   | Obtains a lecturer's timetable                                |
| [GET `/lecturer/clashing-timetable`](#get-lecturerclashing-timetable) | Obtains the timetables that clash with a lecturer's timetable |

## POST `/auth/login`

Logs a user into the server.

### Body Parameters

| Name       | Required | Default | Description                       |
| ---------- | -------- | ------- | --------------------------------- |
| `login`    | ✅       | N/A     | The login to authenticate with    |
| `password` | ✅       | N/A     | The password to authenticate with |

### Response

Any of the [`User`](#users) object.

## POST `/auth/logout`

Logs a user out. This clears the session cookie. This endpoint does not need any parameter.

### Response

Returns a 200 OK on success.

## GET `/student/timetable`

Obtains a student's timetable.

This endpoint is restricted to a student or lecturer, in which they must authenticate through their respective login endpoints first.

### Query Parameters

| Name        | Required | Default | Description                                                         | Example    |
| ----------- | -------- | ------- | ------------------------------------------------------------------- | ---------- |
| `session`   | ✅       | N/A     | The academic session to retrieve the timetable for                  | 2024/2025  |
| `semester`  | ✅       | N/A     | The academic semester to retrieve the timetable for                 | 1, 2, or 3 |
| `matric_no` | ✅       | N/A     | The matric number of the student whose timetable is to be retrieved | N/A        |

### Response

A list of [`Timetable`](#timetable) objects.

## GET `/student/search`

Searches for students.

This endpoint is restricted to a student or lecturer, in which they must authenticate through their respective login endpoints first.

### Query Parameters

| Name     | Required | Default | Description                                                                             | Example |
| -------- | -------- | ------- | --------------------------------------------------------------------------------------- | ------- |
| `query`  | ✅       | N/A     | The query to search for. Can be a student's name or matric number                       | N/A     |
| `limit`  | ❌       | 10      | The maximum number of students to return. Defaults to 10                                | 5       |
| `offset` | ❌       | 0       | The number of students to skip before starting to collect the result set. Defaults to 0 | 5       |

### Response

A list of [`Student`](#student) objects that fulfill the search criteria.

## GET `/lecturer/timetable`

Obtains a lecturer's timetable.

This endpoint is restricted to a student or lecturer, in which they must authenticate through their respective login endpoints first.

### Query Parameters

| Name        | Required | Default | Description                                                          | Example    |
| ----------- | -------- | ------- | -------------------------------------------------------------------- | ---------- |
| `session`   | ✅       | N/A     | The academic session to retrieve the timetable for                   | 2024/2025  |
| `semester`  | ✅       | N/A     | The academic semester to retrieve the timetable for                  | 1, 2, or 3 |
| `worker_no` | ✅       | N/A     | The worker number of the lecturer whose timetable is to be retrieved | N/A        |

### Response

A list of [`Timetable`](#timetable) objects.

## GET `/lecturer/clashing-timetable`

Obtains the timetables that clash with a lecturer's timetable.

This endpoint is restricted to a lecturer, in which they must authenticate through their respective login endpoints first.

### Query Parameters

| Name        | Required | Default | Description                                                          | Example    |
| ----------- | -------- | ------- | -------------------------------------------------------------------- | ---------- |
| `session`   | ✅       | N/A     | The academic session to retrieve the timetable for                   | 2024/2025  |
| `semester`  | ✅       | N/A     | The academic semester to retrieve the timetable for                  | 1, 2, or 3 |
| `worker_no` | ✅       | N/A     | The worker number of the lecturer whose timetable is to be retrieved | N/A        |

### Response

A list of [`ClashTimetable`](#clash-timetable) objects.

# Data Types

## Users

These are users who can authenticate to the server.

### Student

```ts
type IStudent = {
    /**
     * The matric number of the student.
     */
    matricNo: string;

    /**
     * The name of the student.
     */
    name: string;

    /**
     * The code of the course the student is enrolled in. See enrolled course codes data types section.
     */
    courseCode: TTMSCourseCode;

    /**
     * The code of the faculty the student is enrolled in. See faculty codes data types section.
     */
    facultyCode: TTMSFacultyCode;

    /**
     * The K.P. no of the student.
     */
    kpNo: string;
};
```

### Lecturer

```ts
type ILecturer = {
    /**
     * The name of the lecturer.
     */
    name: string;

    /**
     * The worker number of the lecturer.
     */
    workerNo: number;
};
```

## Timetable

```ts
type ITimetable = {
    /**
     * The day of the timetable. See Day data type section.
     */
    day: CourseSectionScheduleDay;

    /**
     * The time of the timetable. See Time data type section.
     */
    time: CourseSectionScheduleTime;

    /**
     * Information about the venue. Can be `null`, which means there is no assigned venue.
     *
     * See Timetable venue data type section.
     */
    venue: TimetableVenue | null;

    /**
     * Information about the course section.
     *
     * See Timetable course section data type section.
     */
    courseSection: TimetableCourseSection;

    /**
     * Information about the lecturer. Can be `null`, which means there is no assigned lecturer.
     *
     * See Timetable lecturer data type section.
     */
    lecturer: TimetableLecturer | null;
};
```

### Clash Timetable

```ts
type ClashTimetable = {
    /**
     * The day of the timetable. See Day data type section.
     */
    day: CourseSectionScheduleDay;

    /**
     * The time of the timetable. See Time data type section.
     */
    time: CourseSectionScheduleTime;

    /**
     * Information about the venue. Can be `null`, which means there is no assigned venue.
     */
    venue: TimetableVenue | null;

    /**
     * Course sections that clash with the lecturer's timetable at the day and time.
     *
     * See Timetable course section data type section.
     */
    courseSections: TimetableCourseSection[];

    /**
     * Information about the lecturer. Can be `null`, which means there is no assigned lecturer.
     */
    lecturer: TimetableLecturer | null;
};
```

### Timetable course section

```ts
type TimetableCourseSection = {
    /**
     * The section that this timetable represents.
     */
    section: string;

    /**
     * Information about the course.
     *
     * See Timetable course data type section.
     */
    course: TimetableCourse;
};
```

### Timetable course

```ts
type TimetableCourse = {
    /**
     * The code of the course.
     */
    code: string;

    /**
     * The name of the course.
     */
    name: string;
};
```

### Timetable venue

```ts
type TimetableVenue = {
    /**
     * The short name of the venue.
     */
    shortName: string;
};
```

### Timetable lecturer

```ts
type TimetableLecturer = {
    /**
     * The name of the lecturer.
     */
    name: string;
};
```

## Enrolled course codes

Possible values:

- SCS
- SCSV
- SCSD
- SCSR
- SCSB
- SCSJ
- SIDKI
- SCSP
- YASUH
- SYED
- SECJ
- SECV
- SECR
- SECP
- SECB
- SECRH
- SECVH
- SECJH
- SECPH
- SECBH
- MOHAM
- ISSA
- IBRAH
- CHONG
- HASSA
- SCSEH
- YUSRI
- SCJ
- SPS
- SKB
- SCB
- SPL
- SCR
- SCV
- SCI
- SCD
- ZULKH
- SCK
- XSCSJ
- XSCSV
- XSCSR
- XSCSB
- XSCSD
- XSECJ
- XSECR
- XSECP
- XSECB
- XSCJ

## Faculty codes

Possible values:

- FSKSM
- FC
- FK

## Day

| Value | Description |
| ----- | ----------- |
| 1     | Sunday      |
| 2     | Monday      |
| 3     | Tuesday     |
| 4     | Wednesday   |
| 5     | Thursday    |
| 6     | Friday      |
| 7     | Saturday    |

## Time

| Value | Description   |
| ----- | ------------- |
| 1     | 7:00 - 7:50   |
| 2     | 8:00 - 8:50   |
| 3     | 9:00 - 9:50   |
| 4     | 10:00 - 10:50 |
| 5     | 11:00 - 11:50 |
| 6     | 12:00 - 12:50 |
| 7     | 13:00 - 13:50 |
| 8     | 14:00 - 14:50 |
| 9     | 15:00 - 15:50 |
| 10    | 16:00 - 16:50 |
| 11    | 17:00 - 17:50 |
| 12    | 18:00 - 18:50 |
| 13    | 19:00 - 19:50 |
| 14    | 20:00 - 20:50 |
| 15    | 21:00 - 21:50 |
| 16    | 22:00 - 22:50 |
