import { defineConfig } from "@prisma/config";

// Eğer env dosyası okunmuyorsa diye bir güvenlik önlemi:
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Buraya doğrudan bir string de yazabilirsin denemek için
    // Ama profesyonel yol budur:
    url: "postgresql://aysenurulku@localhost:5432/luxelogic_db?schema=public",
  },
});
