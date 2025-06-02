import { config } from "dotenv";
import "reflect-metadata";
import { createApp } from "./app";
import { registerDependencies } from "./dependencies/register";

config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

registerDependencies();

const app = createApp();
const port = parseInt(process.env.SERVER_PORT ?? "3001");

app.listen(port, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Server is running on port ${port.toString()}`);
});
