import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { Server } from "socket.io"; // 🚨 YENİ: Socket.io tipini içeri alıyoruz

// Context çantamıza telsizi (io) ekliyoruz
export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma;
  io: Server; // 🚨 YENİ: Telsizimiz artık çantada!
}

// createContext fonksiyonunun parametrelerine io'yu ekliyoruz
export const createContext = async ({
  req,
  io, // 🚨 YENİ: index.ts'den bu telsizi alacağız
}: {
  req: any;
  io: Server;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  // Token yoksa bile io'yu döndürmeyi unutmuyoruz
  if (!token) return { user: null, prisma, io };

  try {
    const decoded = jwt.verify(token, "supersecretkey") as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    return { user, prisma, io }; // 🚨 YENİ: Her şey yolundaysa io'yu da teslim et
  } catch (error) {
    return { user: null, prisma, io }; // 🚨 YENİ: Hata olsa bile io çökmesin
  }
};
