import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const DATA_DIR = process.env.DATA_DIR || "data";

// Create drizzle instance with schema
export const db = drizzle(`file:${DATA_DIR}/database.sqlite`, {
  schema,
});

await migrate(db, {
  migrationsFolder: "drizzle",
});

// Export schema for use in other files
export { schema };
