import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use("/api", apiRouter);

  app.use((error, _req, res, _next) => {
    res.status(400).json({
      ok: false,
      message: error.message || "Unexpected error"
    });
  });

  return app;
}
