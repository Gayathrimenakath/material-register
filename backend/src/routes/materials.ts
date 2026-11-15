import { asc, count, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { materials, plants } from "../db/schema.js";
import { materialsQuerySchema } from "../schemas/materials.js";

const router = Router();

router.get("/", async (req, res) => {
  // A ZodError is thrown on bad input and becomes a 400 in errorHandler.
  const { page, pageSize } = materialsQuerySchema.parse(req.query);

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
      .orderBy(asc(materials.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(materials),
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
