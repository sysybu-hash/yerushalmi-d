import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  pgEnum,
  serial,
  text,
  numeric,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import type { StudioProjectSnapshot } from "@/lib/studio-project-snapshot";

// סוג היהלום — טבעי או מעבדה
export const productTypeEnum = pgEnum("product_type", ["natural", "lab"]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 12, scale: 2 }),
  type: productTypeEnum("type").notNull().default("natural"),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: text("image_url"),
  secondaryImageUrl: text("secondary_image_url"),
  videoUrl: text("video_url"),
  mediaGallery: jsonb("media_gallery").$type<
    Array<{ type: "image" | "video"; url: string }>
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ערוץ הדיוור — אימייל או SMS
export const campaignTypeEnum = pgEnum("campaign_type", ["email", "sms"]);

// מצב הקמפיין — טיוטה או נשלח
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "sent",
]);

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: campaignTypeEnum("type").notNull().default("email"),
  status: campaignStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// מצב הזמנה — ממתינה לתשלום, שולמה, נשלחה
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "shipped",
]);

export const deliveryMethodEnum = pgEnum("delivery_method", [
  "delivery",
  "pickup",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "pending",
  "resolved",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryMethod: deliveryMethodEnum("delivery_method")
    .notNull()
    .default("delivery"),
  deliveryAddress: text("delivery_address"),
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: inquiryStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id").notNull(),
  productTitle: text("product_title").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// סוג מסמך — חשבונית מס או חשבונית מס/קבלה
export const invoiceTypeEnum = pgEnum("invoice_type", [
  "invoice",
  "receipt",
]);

// מצב החשבונית
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "cancelled",
]);

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  type: invoiceTypeEnum("type").notNull().default("invoice"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  customerTaxId: varchar("customer_tax_id", { length: 30 }),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
});

export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// הגדרות האתר — key/value: טקסטים ותמונות הניתנים לעריכה מאזור הניהול
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studioProjectStatusEnum = pgEnum("studio_project_status", [
  "draft",
  "in_progress",
  "ready",
  "published",
]);

/** תיק עבודות בסטודיו AI — שמירת מצב מלא עד לפרסום */
/** נכסי מדיה שנוצרו בסטודיו AI — טיוטה עד לפרסום מהספרייה */
export const aiMediaAssets = pgTable("ai_media_assets", {
  id: serial("id").primaryKey(),
  mediaType: text("media_type").notNull(),
  originalUrl: text("original_url").notNull(),
  generatedUrl: text("generated_url").notNull(),
  title: text("title"),
  status: text("status").notNull().default("draft"),
  publishedProductId: integer("published_product_id").references(
    () => products.id
  ),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studioProjects = pgTable("studio_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("עבודה חדשה"),
  status: studioProjectStatusEnum("status").notNull().default("draft"),
  thumbnailUrl: text("thumbnail_url"),
  snapshot: jsonb("snapshot").$type<StudioProjectSnapshot>().notNull(),
  publishedProductId: integer("published_product_id").references(() => products.id),
  publishedSettingKey: varchar("published_setting_key", { length: 100 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// יחסים — מאפשרים שליפת הזמנה עם פריטיה בשאילתה אחת (db.query)
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type NewContactInquiry = typeof contactInquiries.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type AiMediaAsset = typeof aiMediaAssets.$inferSelect;
export type NewAiMediaAsset = typeof aiMediaAssets.$inferInsert;
export type StudioProject = typeof studioProjects.$inferSelect;
export type NewStudioProject = typeof studioProjects.$inferInsert;
