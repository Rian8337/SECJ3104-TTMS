import "reflect-metadata";
import {
    CourseRepository,
    LecturerRepository,
    SessionRepository,
    StudentRepository,
    VenueRepository,
} from "@/repositories";
import {
    AuthService,
    LecturerService,
    StudentService,
    VenueService,
} from "@/services";
import { container } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

const classes = [
    CourseRepository,
    LecturerRepository,
    SessionRepository,
    StudentRepository,
    VenueRepository,
    AuthService,
    LecturerService,
    StudentService,
    VenueService,
];

for (const cls of classes) {
    const token = Reflect.getMetadata("registrationToken", cls) as
        | symbol
        | undefined;

    if (!token) {
        throw new Error(
            `Class ${cls.name} is missing a registration token. Please use the @Service or @Repository decorator.`
        );
    }

    container.registerSingleton(
        token,
        cls as constructor<InstanceType<typeof cls>>
    );
}
