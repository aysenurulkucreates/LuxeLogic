import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// 1. Context'in içindeki verilerin tipini güncelliyoruz (TS lüksü!)
export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma; // 🚑 KRİTİK DİKİŞ: Prisma'yı çantanın bir parçası yapıyoruz!
}

// 2. Ana fonksiyonumuz
export const createContext = async ({
  req,
}: {
  req: any;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  // 💉 Token yoksa bile prisma'yı döndürmelisin ki sistem "undefined" diye çökmesin!
  if (!token) return { user: null, prisma };

  try {
    const decoded = jwt.verify(token, "supersecretkey") as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    return { user, prisma }; // ✅ Çantaya Prisma amcayı da koyduk!
  } catch (error) {
    return { user: null, prisma }; // 🚑 Hata olsa bile prisma'yı geri veriyoruz.
  }
};
