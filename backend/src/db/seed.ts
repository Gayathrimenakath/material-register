import { faker } from "@faker-js/faker";
import { count } from "drizzle-orm";
import { db, pool } from "./index.js";
import { materials, materialStatusEnum, plants } from "./schema.js";

const MATERIAL_COUNT = 5000;
const BATCH_SIZE = 500;

const PLANTS = [
  { code: "1000", name: "Brisbane", location: "Brisbane, Australia" },
  { code: "1100", name: "Sydney", location: "Sydney, Australia" },
  { code: "1200", name: "Melbourne", location: "Melbourne, Australia" },
  { code: "1300", name: "Perth", location: "Perth, Australia" },
  { code: "1400", name: "Adelaide", location: "Adelaide, Australia" },
];

const MANUFACTURERS = ["SKF", "Siemens", "Parker Hannifin", "Gates", "Festo", "Timken", "3M", "Shell"];

// Each sample ties a description to a matching type and unit of measure.
const SAMPLES = [
  { description: "Bearing, deep groove ball, 25mm bore", type: "Spare Part", uom: "EA" },
  { description: "Mechanical seal, 35mm shaft", type: "Spare Part", uom: "EA" },
  { description: "V-belt, section B, 1500mm", type: "Spare Part", uom: "EA" },
  { description: "Spiral wound gasket, DN100", type: "Spare Part", uom: "EA" },
  { description: "Grease cartridge, EP2 lithium, 400g", type: "Consumable", uom: "EA" },
  { description: "Cutting disc, 125mm x 1mm", type: "Consumable", uom: "EA" },
  { description: "Nitrile gloves, size 9, box of 100", type: "Consumable", uom: "BX" },
  { description: "Hydraulic oil ISO VG 46, 20L drum", type: "Consumable", uom: "L" },
  { description: "Steel plate, mild, 10mm thick", type: "Raw Material", uom: "KG" },
  { description: "Stainless steel 316 round bar, 25mm", type: "Raw Material", uom: "M" },
  { description: "Copper tube, 22mm OD", type: "Raw Material", uom: "M" },
  { description: "Epoxy resin, 10L pail", type: "Raw Material", uom: "L" },
  { description: "Torque wrench, 200Nm", type: "Tool", uom: "EA" },
  { description: "Socket set, 40-piece, metric", type: "Tool", uom: "EA" },
  { description: "Drill bit, HSS, 8mm", type: "Tool", uom: "EA" },
  { description: "Digital caliper, 200mm range", type: "Tool", uom: "EA" },
] as const;

function buildMaterial(index: number, plantIds: number[]) {
  const sample = faker.helpers.arrayElement(SAMPLES);
  const createdAt = faker.date.past({ years: 3 });
  return {
    // Text, not a number, so the prefix and leading zeros are kept.
    materialNumber: `MAT-${String(index + 1).padStart(6, "0")}`,
    description: sample.description,
    type: sample.type,
    status: faker.helpers.arrayElement(materialStatusEnum.enumValues),
    manufacturer: faker.helpers.arrayElement(MANUFACTURERS),
    manufacturerPartNumber: faker.string.alphanumeric({ length: 8, casing: "upper" }),
    plantId: faker.helpers.arrayElement(plantIds),
    unitOfMeasure: sample.uom,
    unitPrice: faker.number.float({ min: 1, max: 2000, fractionDigits: 2 }).toFixed(2), // numeric is a string in Drizzle
    stockQuantity: faker.number.int({ min: 0, max: 500 }),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
}

async function seed() {
  faker.seed(42); // same data on every run

  const [{ value: plantCount }] = await db.select({ value: count() }).from(plants);
  const [{ value: materialCount }] = await db.select({ value: count() }).from(materials);
  if (plantCount > 0 || materialCount > 0) {
    throw new Error(
      `Refusing to seed: tables are not empty (plants: ${plantCount}, materials: ${materialCount}). ` +
        "This script never deletes data.",
    );
  }

  // One transaction: a failure leaves the database unchanged.
  await db.transaction(async (tx) => {
    const createdPlants = await tx.insert(plants).values(PLANTS).returning({ id: plants.id });
    const plantIds = createdPlants.map((p) => p.id);

    const rows = Array.from({ length: MATERIAL_COUNT }, (_, i) => buildMaterial(i, plantIds));
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await tx.insert(materials).values(rows.slice(i, i + BATCH_SIZE));
    }
  });

  console.log(`Seeded ${PLANTS.length} plants and ${MATERIAL_COUNT} materials.`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end()); // otherwise the open pool keeps Node running
