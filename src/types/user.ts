import type { ILecturer, IStudent } from "@/database/schema";

// Express does not have a built-in way to type the request object, so we need to
// separate each user's session data into its own property.
declare module "express-serve-static-core" {
    interface Request {
        /**
         * The session data of the user, if the user is authenticated as a lecturer.
         */
        lecturer?: ILecturer;

        /**
         * The session data of the user, if the user is authenticated as a student.
         */
        student?: IStudent;
    }
}

/**
 * Available user roles.
 */
export enum UserRole {
    student,
    lecturer,
}
