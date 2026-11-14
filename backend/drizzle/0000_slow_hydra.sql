CREATE TYPE "public"."material_status" AS ENUM('Active', 'Obsolete', 'Pending Review');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('Spare Part', 'Consumable', 'Raw Material', 'Tool');--> statement-breakpoint
CREATE TABLE "materials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "materials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"material_number" text NOT NULL,
	"description" text NOT NULL,
	"type" "material_type" NOT NULL,
	"status" "material_status" NOT NULL,
	"manufacturer" varchar(150),
	"manufacturer_part_number" varchar(100),
	"plant_id" integer NOT NULL,
	"unit_of_measure" varchar(10) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materials_material_number_unique" UNIQUE("material_number")
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"location" varchar(150) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_plant_id_idx" ON "materials" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "materials_type_idx" ON "materials" USING btree ("type");--> statement-breakpoint
CREATE INDEX "materials_status_idx" ON "materials" USING btree ("status");--> statement-breakpoint
CREATE INDEX "materials_manufacturer_idx" ON "materials" USING btree ("manufacturer");