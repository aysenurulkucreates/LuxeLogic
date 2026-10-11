import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { appointmentTypeDef } from "./graphql/appointments/appointment.typeDef.js";
import { customerTypeDef } from "./graphql/customers/customer.typeDef.js";
import { productTypeDef } from "./graphql/products/product.typeDef.js";
import { saleTypeDef } from "./graphql/sales/sale.typeDef.js";
import { staffTypeDef } from "./graphql/staffs/staff.typeDef.js";
import { tenantTypeDef } from "./graphql/tenants/tenant.typeDef.js";
import { dashboardTypeDef } from "./graphql/dashboard/dashboard.typeDef.js";
import { userTypeDef } from "./graphql/users/user.typeDef.js";
import { commonTypeDef } from "./graphql/typedefs/common.typeDef.js";

import { appointmentResolvers } from "./graphql/appointments/appointment.resolvers.js";
import { getUserFromToken, createContext } from "./context/context.js";
import { customerResolvers } from "./graphql/customers/customer.resolvers.js";
import { productResolvers } from "./graphql/products/product.resolvers.js";
import { dashboardResolvers } from "./graphql/dashboard/dashboard.resolvers.js";
import { saleResolvers } from "./graphql/sales/sale.resolvers.js";
import { staffResolvers } from "./graphql/staffs/staff.resolvers.js";
import { tenantResolvers } from "./graphql/tenants/tenant.resolvers.js";
import { userResolvers } from "./graphql/users/user.resolvers.js";

const app = express();
const httpServer = http.createServer(app);

// Socket.io için modern kurulum
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

const typeDefs = [
  appointmentTypeDef,
  customerTypeDef,
  productTypeDef,
  saleTypeDef,
  staffTypeDef,
  tenantTypeDef,
  userTypeDef,
  dashboardTypeDef,
  commonTypeDef,
];

const resolvers = [
  appointmentResolvers,
  customerResolvers,
  productResolvers,
  dashboardResolvers,
  saleResolvers,
  staffResolvers,
  tenantResolvers,
  userResolvers,
];

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => await createContext({ req, io }),
  }) as any,
);

// Socket bağlantısı kabul edilmeden önce kimlik kontrolü,
// GraphQl ile aynı kuralı kullanır: token'i doğrula, ullanıcıyı veritabanından yükle.
io.use(async (socket, next) => {
  try {
    const user = await getUserFromToken(socket.handshake.auth?.token);
    if (!user) return next(new Error("UNAUTHENTICATED"));

    socket.data.user = user;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Hnagi bağlantı socket.id hangi klinikte tenantId, hangi kaydı recordId kilitli
const lockedRecords = new Map<string, { tenantId: string; recordId: string }>();

io.on("connection", (socket) => {
  // Klinik ve e-posta istemciden değil, doğrulanmış kullanıcıdan gelir.
  const { id: userId, tenantId, email } = socket.data.user;
  console.log("Socket connected:", socket.id, "user:", userId);

  // odayı sunucu seçeri tenantId si olmayan kullanıcı hiçbir odaya giremez.
  if (tenantId) socket.join(tenantId);

  // düzenleme başladı, kaydı kilitle
  socket.on("lock_record", (payload) => {
    const recordId = payload?.recordId;
    if (!tenantId || !recordId) return;

    lockedRecords.set(socket.id, { tenantId, recordId });
    socket.broadcast
      .to(tenantId)
      .emit("record_locked", { recordId, lockedBy: email });
  });

  // düzenleme bitti, klidi aç
  socket.on("unlock_record", (payload) => {
    const recordId = payload?.recordId;
    if (!tenantId || !recordId) return;

    lockedRecords.delete(socket.id);
    socket.broadcast.to(tenantId).emit("record_unlocked", { recordId });
  });

  // bağlantı koptu, elinde kilitli kayot varsa otomatik aç
  socket.on("disconnected", () => {
    console.log("Socket disconnected", socket.id);

    const lock = lockedRecords.get(socket.id);
    if (lock) {
      socket.broadcast
        .to(lock.tenantId)
        .emit("record_unlocked", { recordId: lock.recordId });
      lockedRecords.delete(socket.id);
      console.log("Auto-unlocked record after disconnected:", lock.recordId);
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`LuxeLogic Server ready!`);
  console.log(`GraphQL: http://localhost:${PORT}/graphql`);
});
