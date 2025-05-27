import { dependencyTokens } from "@/dependencies/tokens";
import { container } from "tsyringe";
import { db } from ".";

container.registerInstance(dependencyTokens.drizzleDb, db);
