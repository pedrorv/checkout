import type { Server } from "node:http";
import {
  app,
  connectPrisma,
  disconnectPrisma,
  runMigrations,
  startSchedulers,
  stopSchedulers,
} from "./infra";
import { config } from "./shared";

let server: Server;

runMigrations()
  .then(() => connectPrisma())
  .then(() => {
    server = app.listen(config.port, () => {
      console.log(`Listening on port ${config.port}`);
    });
    startSchedulers();
  })
  .catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
  });

const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");

  stopSchedulers();

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  await disconnectPrisma();
  process.exit(0);
};

const shutdownSignals = ["SIGINT", "SIGTERM"];
for (const signal of shutdownSignals) {
  process.on(signal, gracefulShutdown);
}

const errorSignals = ["uncaughtException", "unhandledRejection"];
for (const signal of errorSignals) {
  process.on(signal, async (error: Error) => {
    console.error("Unexpected error:", error);
    await gracefulShutdown();
  });
}
