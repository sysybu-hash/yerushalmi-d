CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'sent');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('pending', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('invoice', 'receipt');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('natural', 'lab');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" "campaign_type" DEFAULT 'email' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"type" "invoice_type" DEFAULT 'invoice' NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"customer_address" text,
	"customer_tax_id" varchar(30),
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"vat_rate" numeric(5, 2) NOT NULL,
	"vat_amount" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"notes" text,
	"order_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"product_title" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"delivery_method" "delivery_method" DEFAULT 'delivery' NOT NULL,
	"delivery_address" text,
	"customer_notes" text,
	"admin_notes" text,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"original_price" numeric(12, 2),
	"type" "product_type" DEFAULT 'natural' NOT NULL,
	"category" varchar(100) NOT NULL,
	"image_url" text,
	"secondary_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;