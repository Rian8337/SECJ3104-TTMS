import {
    CourseRepository,
    LecturerRepository,
    SessionRepository,
    StudentRepository,
    VenueRepository,
} from "@/repositories";
import {
    AnalyticsService,
    AuthService,
    LecturerService,
    StudentService,
    VenueService,
} from "@/services";
import { container as globalContainer } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
import { dependencyTokens } from "./tokens";
import { db } from "@/database";

const classes = [
    CourseRepository,
    LecturerRepository,
    SessionRepository,
    StudentRepository,
    VenueRepository,
    AnalyticsService,
    AuthService,
    LecturerService,
    StudentService,
    VenueService,
];

/**
 * Registers all repositories and services to a DI container.
 *
 * @param container The DI container to register the dependencies to.
 * If not provided, the global container will be used.
 */
export function registerDependencies(container = globalContainer) {
    container.registerInstance(dependencyTokens.drizzleDb, db);

    for (const cls of classes) {
        const token = Reflect.getMetadata("registrationToken", cls) as
            | symbol
            | undefined;

        if (!token) {
            throw new Error(
                `Class ${cls.name} is missing a registration token. Please use the @Service or @Repository decorator.`
            );
        }

        container.register(token, {
            useClass: cls as constructor<InstanceType<typeof cls>>,
        });
    }
}
