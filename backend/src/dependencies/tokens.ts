import { DrizzleDb } from "@/database";
import {
    ICourseRepository,
    ILecturerRepository,
    ISessionRepository,
    IStudentRepository,
    IVenueRepository,
} from "@/repositories";
import {
    IAnalyticsService,
    IAuthService,
    ILecturerService,
    IStudentService,
    IVenueService,
} from "@/services";
import { InjectionToken } from "tsyringe";

/**
 * Tokens for dependency injection.
 */
export const dependencyTokens = {
    /**
     * Injection token for a Drizzle database instance.
     */
    drizzleDb: Symbol.for("IDatabase") as InjectionToken<DrizzleDb>,

    //#region Repositories

    /**
     * Injection token for an {@link ICourseRepository}.
     */
    courseRepository: Symbol.for(
        "ICourseRepository"
    ) as InjectionToken<ICourseRepository>,

    /**
     * Injection token for an {@link ILecturerRepository}.
     */
    lecturerRepository: Symbol.for(
        "ILecturerRepository"
    ) as InjectionToken<ILecturerRepository>,

    /**
     * Injection token for an {@link ISessionRepository}.
     */
    sessionRepository: Symbol.for(
        "ISessionRepository"
    ) as InjectionToken<ISessionRepository>,

    /**
     * Injection token for an {@link IStudentRepository}.
     */
    studentRepository: Symbol.for(
        "IStudentRepository"
    ) as InjectionToken<IStudentRepository>,

    /**
     * Injection token for an {@link IVenueRepository}.
     */
    venueRepository: Symbol.for(
        "IVenueRepository"
    ) as InjectionToken<IVenueRepository>,

    //#endregion

    //#region Services

    /**
     * Injection token for an {@link IAnalyticsService}.
     */
    analyticsService: Symbol.for(
        "IAnalyticsService"
    ) as InjectionToken<IAnalyticsService>,

    /**
     * Injection token for an {@link IAuthService}.
     */
    authService: Symbol.for("IAuthService") as InjectionToken<IAuthService>,

    /**
     * Injection token for an {@link ILecturerService}.
     */
    lecturerService: Symbol.for(
        "ILecturerService"
    ) as InjectionToken<ILecturerService>,

    /**
     * Injection token for an {@link IStudentService}.
     */
    studentService: Symbol.for(
        "IStudentService"
    ) as InjectionToken<IStudentService>,

    /**
     * Injection token for an {@link IVenueService}.
     */
    venueService: Symbol.for("IVenueService") as InjectionToken<IVenueService>,

    //#endregion
} as const;
