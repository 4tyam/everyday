import cors from "cors";
import express, { type Express } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { healthRouter } from "./routes/health.js";

const app: Express = express();
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use("/health", healthRouter);

export { app };
