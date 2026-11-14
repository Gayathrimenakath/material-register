import {
    pgTable,
    pgEnum,
    integer,
    varchar,
    text,
    numeric,
    timestamp,
    index,
} from "drizzle-orm/pg-core";

export const materialTypeEnum = pgEnum("material_type", [
    "Spare Part",
    "Consumable",
    "Raw Material",
    "Tool",
]);

export const materialStatusEnum = pgEnum("material_status", [
    "Active",
    "Obsolete",
    "Pending Review",
]);

export const plants = pgTable("plants", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    location: varchar("location", { length: 150 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const materials = pgTable(
    "materials",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        // Text, not a number: SAP-style numbers keep prefixes / leading zeros.
        materialNumber: text("material_number").notNull().unique(),
        description: text("description").notNull(),
        type: materialTypeEnum("type").notNull(),
        status: materialStatusEnum("status").notNull(),
        manufacturer: varchar("manufacturer", { length: 150 }),
        manufacturerPartNumber: varchar("manufacturer_part_number", {
            length: 100,
        }),
        plantId: integer("plant_id")
            .notNull()
            .references(() => plants.id),
        unitOfMeasure: varchar("unit_of_measure", { length: 10 }).notNull(), // e.g. EA, KG, L
        // numeric(12,2) in AUD. Drizzle returns numeric as a string, not a number.
        unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
        stockQuantity: integer("stock_quantity").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        // $onUpdate runs in app code (Drizzle), not in a DB trigger.
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        index("materials_plant_id_idx").on(t.plantId),
        index("materials_type_idx").on(t.type),
        index("materials_status_idx").on(t.status),
        index("materials_manufacturer_idx").on(t.manufacturer),
    ],
);
