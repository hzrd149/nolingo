import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

if (!process.env.DATA_DIR) throw new Error("DATA_DIR is not set");

// Create drizzle instance with schema
export const db = drizzle(`file:${process.env.DATA_DIR}/database.sqlite`, {
  schema,
});

// Export schema for use in other files
export { schema };
