import cookieParser from "cookie-parser";
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
    .use(createRouter());

app.listen(parseInt(process.env.SERVER_PORT ?? "3000"), (err) => {
    if (err) {
        throw err;
    }

    console.log("Server is running on port 3000");
});
