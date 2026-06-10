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
} from "drizzle-orm/pg-core";

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

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
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

// הגדרות האתר — key/value: טקסטים ותמונות הניתנים לעריכה מאזור הניהול
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
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
