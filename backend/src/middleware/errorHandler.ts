import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

// Every error response has the same shape: { error: { message, details? } }

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Invalid input -> 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Invalid request",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Malformed JSON body (thrown by express.json()) -> 400
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { message: "Malformed JSON in request body" } });
    return;
  }

  // Everything else -> 500.
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
