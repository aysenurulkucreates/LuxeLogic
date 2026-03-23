import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { Server } from "socket.io";

// the instruction is: 'the login credentials and database connection of the request to the system should be provided readily to all background functions.'
export interface GraphQLContext {
  user: any | null;
  prisma: typeof prisma;
  io: Server;
}

// the system receives the door card(token) sent by the user and checks if it's real or fake(JWT Verify). If it's real, it finds the person in the database, puts them in its backpack(context), and lets them in. otherwise, it asks 'Who are you?' and sends them away empty-handed.
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

  try {
    const decoded = jwt.verify(token, "supersecretkey") as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    return { user, prisma, io };
  } catch (error) {
    return { user: null, prisma, io };
  }
};
