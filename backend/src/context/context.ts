import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { Server } from "socket.io";

export interface myContext {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
  prisma: any;
  io: any;
}

export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma;
  io: Server;
}

export const getUserFromToken = async (token?: string | null) => {
  if (!token) return null;

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined.");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });
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

  return { user, prisma, io };
};
