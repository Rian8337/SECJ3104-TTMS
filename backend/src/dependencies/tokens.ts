/**
 * Tokens for dependency injection.
 */
export const dependencyTokens = {
    // Drizzle ORM
    drizzleDb: Symbol.for("IDatabase"),

    // Repositories
    courseRepository: Symbol.for("ICourseRepository"),
    lecturerRepository: Symbol.for("ILecturerRepository"),
    sessionRepository: Symbol.for("ISessionRepository"),
    studentRepository: Symbol.for("IStudentRepository"),
    venueRepository: Symbol.for("IVenueRepository"),

    // Services
    authService: Symbol.for("IAuthService"),
    lecturerService: Symbol.for("ILecturerService"),
    studentService: Symbol.for("IStudentService"),
    venueService: Symbol.for("IVenueService"),
} as const;
