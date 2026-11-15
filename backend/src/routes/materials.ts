import { asc, count, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { materials, plants } from "../db/schema.js";
import { materialsQuerySchema } from "../schemas/materials.js";

const router = Router();

// In LIKE patterns, % and _ are wildcards. Escape them (and the escape character
// itself, backslash) so a search for "50%" matches the literal text.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

router.get("/", async (req, res) => {
  // A ZodError is thrown on bad input and becomes a 400 in errorHandler.
  const { search, page, pageSize } = materialsQuerySchema.parse(req.query);

  // Case-insensitive "contains" match on the three searchable columns.
  const pattern = search ? `%${escapeLike(search)}%` : undefined;
  const where = pattern
    ? or(
        ilike(materials.materialNumber, pattern),
        ilike(materials.description, pattern),
        ilike(materials.manufacturerPartNumber, pattern),
      )
    : undefined;

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
      .orderBy(asc(materials.id))
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
