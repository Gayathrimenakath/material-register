import { asc } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { plants } from "../db/schema.js";

const router = Router();

// Small fixed list, used to fill the plant filter dropdown. No pagination needed.
router.get("/", async (_req, res) => {
  const rows = await db
    .select({ id: plants.id, code: plants.code, name: plants.name })
    .from(plants)
    .orderBy(asc(plants.code));
  res.json(rows);
});

export default router;
