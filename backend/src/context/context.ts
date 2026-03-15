import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// Define the structure of our GraphQL Context for TypeScript
export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma; // Essential: Keeps the prisma instance available in all resolvers
}

// Main context creation function called on every request
export const createContext = async ({
  req,
}: {
  req: any;
}): Promise<GraphQLContext> => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  // If no token exists, return prisma with null user to prevent system crash
  if (!token) return { user: null, prisma };

  try {
    // Verify the JWT token - Replace "supersecretkey" with your env variable in production!
    const decoded = jwt.verify(token, "supersecretkey") as { userId: string };

    // Fetch user and tenant data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    return { user, prisma };
  } catch (error) {
    // Return prisma even if token verification fails to keep the app stable
    return { user: null, prisma };
  }
};
