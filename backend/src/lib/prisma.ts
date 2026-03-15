import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg"; // 🚨 KRİTİK EKLEME: pg paketinden bağlantı havuzunu alıyoruz

const { Pool } = pg;

// 1. .env dosyan mermi gibi çalışıyor, adresi oradan çekiyoruz
const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  console.error("CRITICAL: DATABASE_URL not found!");
}

// 2. 🚨 BAĞLANTI HAVUZU: Gelen yoğun istekleri yönetecek "oksijen tüpümüz"
const pool = new Pool({ connectionString });

// 3. Adaptörü bu havuzla (Pool) besliyoruz
const adapter = new PrismaPg(pool as any);

// 4. Adaptörü motorun içine pırlanta gibi yerleştiriyoruz
const prisma = new PrismaClient({ adapter });

export default prisma;
