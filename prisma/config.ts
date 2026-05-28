import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Required for CLI commands (migrate, introspect, studio)
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
