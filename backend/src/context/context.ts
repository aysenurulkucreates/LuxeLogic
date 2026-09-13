import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { Server } from "socket.io";

// Resolver'larda ortak olarak kullanılan context tipi.
// Bu interface, projenin her yerinde "bu fonksiyon hangi bilgilere erişebilir" sorusuna cevap verir.
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

// createContext fonksiyonunun döndürdüğü tip.
// NOT: myContext ile GraphQLContext birbirine çok benziyor ama aynı değil
// (user?: opsiyonel vs user: any | null, prisma: any vs prisma: typeof prisma).
// İleride bunları tek bir interface'te birleştirmek, tutarsızlık riskini azaltır.
export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma;
  io: Server;
}

// Her GraphQL isteğinde çalışır: kullanıcının gönderdiği token'ı (JWT) doğrular,
// geçerliyse kullanıcıyı veritabanından bulup context'e ekler.
// Böylece her resolver, "bu isteği kim yaptı" bilgisine tekrar tekrar
// kod yazmadan context üzerinden erişebilir.
export const createContext = async ({
  req,
  io,
}: {
  req: any;
  io: Server;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (!token) return { user: null, prisma, io };

  // JWT secret'ı ortam değişkeninden okuyoruz — kod içine gömmüyoruz.
  // Bu değer .env dosyasında tutulur ve asla git'e commit edilmez.
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    return { user, prisma, io };
  } catch (error) {
    // Token geçersiz, süresi dolmuş veya sahte — kullanıcıyı "giriş yapmamış" say.
    return { user: null, prisma, io };
  }
};
