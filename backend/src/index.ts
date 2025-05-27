import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import "reflect-metadata";
import "./dependencies/register";
import "./controllers";
import { createRouter } from "./router";

const app = express();

app.use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use(cookieParser(process.env.COOKIE_SECRET))
    .use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        })
    )
    .use(createRouter());

const port = parseInt(process.env.SERVER_PORT ?? "3001");

app.listen(port, (err) => {
    if (err) {
        throw err;
    }

    console.log(`Server is running on port ${port.toString()}`);
});
