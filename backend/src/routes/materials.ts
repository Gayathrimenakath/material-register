import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { Router } from "express";
import { db } from "../db/index.js";
import { materials, plants } from "../db/schema.js";
import { materialsQuerySchema, type SORTABLE_COLUMNS } from "../schemas/materials.js";
import { escapeLike } from "../utils/escapeLike.js";

const router = Router();

// Maps each whitelisted sortBy value to a real column (no SQL built from strings).
const sortColumns: Record<(typeof SORTABLE_COLUMNS)[number], PgColumn> = {
  materialNumber: materials.materialNumber,
  description: materials.description,
  type: materials.type,
  status: materials.status,
  manufacturer: materials.manufacturer,
  plant: plants.code,
  unitPrice: materials.unitPrice,
  stockQuantity: materials.stockQuantity,
  updatedAt: materials.updatedAt,
};

router.get("/", async (req, res) => {
  // A ZodError is thrown on bad input and becomes a 400 in errorHandler.
  const { search, type, status, plantId, sortBy, sortOrder, page, pageSize } =
    materialsQuerySchema.parse(req.query);

  // Case-insensitive "contains" match on the three searchable columns.
  const pattern = search ? `%${escapeLike(search)}%` : undefined;
  // and() skips undefined entries, so unused search/filters simply drop out.
  const where = and(
    pattern
      ? or(
          ilike(materials.materialNumber, pattern),
          ilike(materials.description, pattern),
          ilike(materials.manufacturerPartNumber, pattern),
        )
      : undefined,
    type ? eq(materials.type, type) : undefined,
    status ? eq(materials.status, status) : undefined,
    plantId ? eq(materials.plantId, plantId) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: materials.id,
        materialNumber: materials.materialNumber,
        description: materials.description,
        type: materials.type,
        status: materials.status,
        manufacturer: materials.manufacturer,
        manufacturerPartNumber: materials.manufacturerPartNumber,
        unitOfMeasure: materials.unitOfMeasure,
        unitPrice: materials.unitPrice,
        stockQuantity: materials.stockQuantity,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        plant: { id: plants.id, code: plants.code, name: plants.name },
      })
      .from(materials)
      .innerJoin(plants, eq(materials.plantId, plants.id))
      .where(where)
      // id is the tiebreaker: without it, rows with equal sort values (say, the
      // same type) could swap places between pages.
      .orderBy((sortOrder === "asc" ? asc : desc)(sortColumns[sortBy]), asc(materials.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(materials).where(where),
  ]);

  res.json({
    // numeric columns come back from Drizzle as strings; convert for the client.
    items: rows.map((row) => ({ ...row, unitPrice: Number(row.unitPrice) })),
    total,
    page,
    pageSize,
  });
});

export default router;
