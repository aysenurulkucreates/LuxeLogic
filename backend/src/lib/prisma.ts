import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

// Veritabanı bağlantı adresini .env dosyasından okuyoruz
const connectionString = process.env.DATABASE_URL;

// Adres yoksa uygulamayı burada durduruyoruz — sonra anlaşılmaz bir hata almak yerine
// hatanın kaynağını en baştan net bir şekilde gösteriyoruz
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// TypeScript'e development ortamında global objesinin içinde
// bir "prisma" alanı olacağını bildiriyoruz (tip tanımı için)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection Pool: veritabanına her istekte sıfırdan bağlanmak yerine,
// önceden açılmış, yeniden kullanılabilir bağlantılardan oluşan bir havuz kuruyoruz.
// Bu, her sorguda yeniden bağlantı kurma maliyetinden (yavaşlık) kurtarır.
const pool = new Pool({ connectionString });

// Prisma'ya, veritabanıyla bu havuz üzerinden konuşmasını söylüyoruz.
// "as any" burada pg paketinin farklı versiyonları arasındaki
// TypeScript tip uyuşmazlığını bastırmak için kullanıldı (bilinen bir Prisma/pg sorunu)
const adapter = new PrismaPg(pool as any);

// Zaten global'de bir prisma instance'ı varsa onu kullan,
// yoksa yeni bir tane oluştur. Bu, "singleton pattern" olarak bilinir.
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

// Sadece development ortamında bu instance'ı global'e kaydediyoruz ki
// hot-reload sırasında (kod her kaydedildiğinde sunucu yeniden başladığında)
// yeni bir pool/bağlantı açılmasın, var olan tekrar kullanılsın.
// Production'da hot-reload olmadığı için bu adıma gerek yok.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
