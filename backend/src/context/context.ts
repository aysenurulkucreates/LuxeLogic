import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// 1. Context'in içindeki verilerin tipini belirliyoruz (TS lüksü!)
export interface GraphQLContext {
  user: any | null;
}

// 2. Ana fonksiyonumuz
export const createContext = async ({
  req,
}: {
  req: any;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (!token) return { user: null };

  try {
    const decoded = jwt.verify(token, "supersecretkey") as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }, // Kullanıcının hangi klinikte olduğunu hep bilelim
    });

    return { user };
  } catch (error) {
    return { user: null };
  }
};
