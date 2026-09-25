import cors from "cors";
import express, { type Express } from "express";
import httpStatus from "http-status";
import { docsRouter } from "../docs/docs.router";
import { config } from "../shared/config";
import { httpRouter } from "./http/router";

const app: Express = express();
const allowedOrigins = new Set(config.webAllowedOrigins);
const corsOptions: cors.CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
};

app.use(express.json());
app.use(cors(corsOptions));
app.options("{*path}", cors(corsOptions));

app.get("/health", (_, res) => {
  res.status(httpStatus.OK).send("OK");
});

if (config.docsEnabled) {
  app.use("/", docsRouter);
}

app.use("/", httpRouter);

export { app };
