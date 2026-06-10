import {
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

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
