import { z } from "zod";

export const MAX_PAGE_SIZE = 100;

// Query-string values always arrive as strings, so numbers use z.coerce.
export const materialsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((value) => value || undefined), // "" -> undefined (no search)
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
});

export type MaterialsQuery = z.infer<typeof materialsQuerySchema>;
