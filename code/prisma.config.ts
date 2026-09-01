import "dotenv/config";
import { defineConfig, env } from "prisma/config";


/**
 * Prisma 7 configuration file.
 * Connection URL is now managed here instead of in schema.prisma.
 * See: https://pris.ly/d/config-datasource
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
