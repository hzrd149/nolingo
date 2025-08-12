import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Create drizzle instance with schema
export const db = drizzle(process.env.DATABASE!, { schema });

// Export schema for use in other files
export { schema };
