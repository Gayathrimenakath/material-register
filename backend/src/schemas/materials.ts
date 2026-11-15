import { z } from "zod";
import { materialStatusEnum, materialTypeEnum } from "../db/schema.js";

export const MAX_PAGE_SIZE = 100;

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
  plantId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
});

export type MaterialsQuery = z.infer<typeof materialsQuerySchema>;
