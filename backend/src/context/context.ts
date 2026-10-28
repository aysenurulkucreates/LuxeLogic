import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { Server } from "socket.io";
import { tenantScope } from "../lib/tenantScope.js";

export type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "STAFF";

export interface myContext {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: Role;
  };
  prisma: any;
  db: any;
  io: any;
}

export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma;
  db: ReturnType<typeof createDb>;
  io: Server;
}

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
  req: any;
  io: Server;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  const user = await getUserFromToken(token);
  const db = createDb(user);

  return { user, prisma, db, io };
};

export const createDb = (
  user: { role: string; tenantId: string | null } | null,
) => {
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") return prisma;
  if (!user.tenantId) return null;
  return prisma.$extends(tenantScope(user.tenantId));
};
