import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createRouter } from "./router";

/**
 * Creates an Express application with all necessary middlewares and routes.
 */
export function createApp() {
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

    return app;
}
