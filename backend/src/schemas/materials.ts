import { z } from "zod";
import { materialStatusEnum, materialTypeEnum } from "../db/schema.js";

export const MAX_PAGE_SIZE = 100;

// Largest value of a Postgres integer column. Anything above would make the
// database error out (a 500) instead of simply matching nothing.
const POSTGRES_INT_MAX = 2147483647;

// The only values sortBy accepts. The route maps each one to a real column.
export const SORTABLE_COLUMNS = [
  "materialNumber",
  "description",
  "type",
  "status",
  "manufacturer",
  "plant",
  "unitPrice",
  "stockQuantity",
  "updatedAt",
] as const;

// Query-string values always arrive as strings, so numbers use z.coerce.
export const materialsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined), // "" -> undefined (no search)
  type: z.enum(materialTypeEnum.enumValues).optional(),
  status: z.enum(materialStatusEnum.enumValues).optional(),
  plantId: z.coerce.number().int().positive().max(POSTGRES_INT_MAX).optional(),
  sortBy: z.enum(SORTABLE_COLUMNS).default("materialNumber"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
});

export type MaterialsQuery = z.infer<typeof materialsQuerySchema>;
