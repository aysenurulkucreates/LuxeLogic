import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import prisma from "../lib/prisma.js";
import { tenantScope } from "../lib/tenantScope.js";

// --- Tipler: hepsi gerçek koddan türetiliyor, elle yazılmış şekil yok ---

// getUserFromToken'ın döndürdüğü kullanıcı (tenant ve staff dahil), null hariç
export type AuthUser = NonNullable<
  Awaited<ReturnType<typeof getUserFromToken>>
>;

// Rol listesi schema.prisma'daki enum'dan geliyor
export type Role = AuthUser["role"];

// Kiracıya kilitli client; db'nin tek tipi bu
const scopedDb = (tenantId: string) => prisma.$extends(tenantScope(tenantId));
export type Db = ReturnType<typeof scopedDb>;

export interface myContext {
  user: AuthUser | null;
  prisma: typeof prisma;
  db: Db | null; // giriş yoksa null (fail closed)
  io: Server;
  ip: string; // rate-limit için
}

// Eski ad: başka bir dosya bunu kullanıyorsa kırılmasın
export type GraphQLContext = myContext;

export const getUserFromToken = async (token?: string | null) => {
  if (!token) return null;

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined.");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true, staff: true },
    });

    if (user?.staff && !user.staff.isActive) return null;

    if (user?.role === "NURSE") return null;

    return user;
  } catch (error) {
    return null;
  }
};

export const createContext = async ({
  req,
  io,
}: {
  req: { headers: { authorization?: string }; ip?: string }; // sadece kullandığımız kısım
  io: Server;
}): Promise<myContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  const user = await getUserFromToken(token);
  const db = createDb(user);

  return { user, prisma, db, io, ip: req.ip ?? "unknown" };
};

export const createDb = (
  user: Pick<AuthUser, "role" | "tenantId"> | null,
): Db | null => {
  if (!user) return null;
  // Geçici (Seçenek A ile kalkacak): SUPER_ADMIN kilitsiz.
  // Extension sadece sorguların içeriğini değiştiriyor, metotları değil;
  // bu yüzden düz prisma çalışma zamanında Db ile aynı şekle sahip.
  if (user.role === "SUPER_ADMIN") return prisma as unknown as Db;
  if (!user.tenantId) return null;
  return scopedDb(user.tenantId);
};
