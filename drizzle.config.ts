import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./database/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:data/nolingo/database.sqlite",
  },
});
