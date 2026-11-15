import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import materialsRouter from "./routes/materials.js";
import plantsRouter from "./routes/plants.js";

const app = express();

app.use(cors()); // allows any origin; fine for local development
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/materials", materialsRouter);
app.use("/api/plants", plantsRouter);

// Order matters: 404 handler after all routes, error handler last.
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
