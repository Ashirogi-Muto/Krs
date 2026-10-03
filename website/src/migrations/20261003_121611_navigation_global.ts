import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_navigation_krs_ctas_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_navigation_krs_footer_columns_accent" AS ENUM('plain', 'krs', 'aurix');
  CREATE TYPE "public"."enum_navigation_aurix_ctas_style" AS ENUM('primary', 'secondary', 'link');
  CREATE TYPE "public"."enum_navigation_aurix_footer_columns_accent" AS ENUM('plain', 'krs', 'aurix');
  CREATE TABLE "navigation_krs_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_krs_ctas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_navigation_krs_ctas_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "navigation_krs_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_krs_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"accent" "enum_navigation_krs_footer_columns_accent" DEFAULT 'plain'
  );
  
  CREATE TABLE "navigation_krs_bottom_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_aurix_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_aurix_ctas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"style" "enum_navigation_aurix_ctas_style" DEFAULT 'primary'
  );
  
  CREATE TABLE "navigation_aurix_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_aurix_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"accent" "enum_navigation_aurix_footer_columns_accent" DEFAULT 'plain'
  );
  
  CREATE TABLE "navigation_aurix_bottom_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"krs_brand_title" varchar,
  	"krs_brand_subtitle" varchar,
  	"krs_logo_id" integer,
  	"krs_footer_blurb" varchar,
  	"krs_footer_address" varchar,
  	"krs_footer_note" varchar,
  	"aurix_brand_title" varchar,
  	"aurix_brand_subtitle" varchar,
  	"aurix_logo_id" integer,
  	"aurix_back_label" varchar,
  	"aurix_footer_blurb" varchar,
  	"aurix_footer_address" varchar,
  	"aurix_footer_note" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "navigation_krs_links" ADD CONSTRAINT "navigation_krs_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_krs_ctas" ADD CONSTRAINT "navigation_krs_ctas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_krs_footer_columns_links" ADD CONSTRAINT "navigation_krs_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_krs_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_krs_footer_columns" ADD CONSTRAINT "navigation_krs_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_krs_bottom_links" ADD CONSTRAINT "navigation_krs_bottom_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_aurix_links" ADD CONSTRAINT "navigation_aurix_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_aurix_ctas" ADD CONSTRAINT "navigation_aurix_ctas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_aurix_footer_columns_links" ADD CONSTRAINT "navigation_aurix_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_aurix_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_aurix_footer_columns" ADD CONSTRAINT "navigation_aurix_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_aurix_bottom_links" ADD CONSTRAINT "navigation_aurix_bottom_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_krs_logo_id_media_id_fk" FOREIGN KEY ("krs_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_aurix_logo_id_media_id_fk" FOREIGN KEY ("aurix_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "navigation_krs_links_order_idx" ON "navigation_krs_links" USING btree ("_order");
  CREATE INDEX "navigation_krs_links_parent_id_idx" ON "navigation_krs_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_krs_ctas_order_idx" ON "navigation_krs_ctas" USING btree ("_order");
  CREATE INDEX "navigation_krs_ctas_parent_id_idx" ON "navigation_krs_ctas" USING btree ("_parent_id");
  CREATE INDEX "navigation_krs_footer_columns_links_order_idx" ON "navigation_krs_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_krs_footer_columns_links_parent_id_idx" ON "navigation_krs_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_krs_footer_columns_order_idx" ON "navigation_krs_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_krs_footer_columns_parent_id_idx" ON "navigation_krs_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "navigation_krs_bottom_links_order_idx" ON "navigation_krs_bottom_links" USING btree ("_order");
  CREATE INDEX "navigation_krs_bottom_links_parent_id_idx" ON "navigation_krs_bottom_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_aurix_links_order_idx" ON "navigation_aurix_links" USING btree ("_order");
  CREATE INDEX "navigation_aurix_links_parent_id_idx" ON "navigation_aurix_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_aurix_ctas_order_idx" ON "navigation_aurix_ctas" USING btree ("_order");
  CREATE INDEX "navigation_aurix_ctas_parent_id_idx" ON "navigation_aurix_ctas" USING btree ("_parent_id");
  CREATE INDEX "navigation_aurix_footer_columns_links_order_idx" ON "navigation_aurix_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_aurix_footer_columns_links_parent_id_idx" ON "navigation_aurix_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_aurix_footer_columns_order_idx" ON "navigation_aurix_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_aurix_footer_columns_parent_id_idx" ON "navigation_aurix_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "navigation_aurix_bottom_links_order_idx" ON "navigation_aurix_bottom_links" USING btree ("_order");
  CREATE INDEX "navigation_aurix_bottom_links_parent_id_idx" ON "navigation_aurix_bottom_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_krs_krs_logo_idx" ON "navigation" USING btree ("krs_logo_id");
  CREATE INDEX "navigation_aurix_aurix_logo_idx" ON "navigation" USING btree ("aurix_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "navigation_krs_links" CASCADE;
  DROP TABLE "navigation_krs_ctas" CASCADE;
  DROP TABLE "navigation_krs_footer_columns_links" CASCADE;
  DROP TABLE "navigation_krs_footer_columns" CASCADE;
  DROP TABLE "navigation_krs_bottom_links" CASCADE;
  DROP TABLE "navigation_aurix_links" CASCADE;
  DROP TABLE "navigation_aurix_ctas" CASCADE;
  DROP TABLE "navigation_aurix_footer_columns_links" CASCADE;
  DROP TABLE "navigation_aurix_footer_columns" CASCADE;
  DROP TABLE "navigation_aurix_bottom_links" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."enum_navigation_krs_ctas_style";
  DROP TYPE "public"."enum_navigation_krs_footer_columns_accent";
  DROP TYPE "public"."enum_navigation_aurix_ctas_style";
  DROP TYPE "public"."enum_navigation_aurix_footer_columns_accent";`)
}
