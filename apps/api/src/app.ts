import cors from "cors";
import express, { type Express } from "express";
import { healthRouter } from "./routes/health";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use("/health", healthRouter);

export { app };
