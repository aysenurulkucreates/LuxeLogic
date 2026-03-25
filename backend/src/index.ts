import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

// 🚨 Apollo'yu artık modern ESM ile çağırıyoruz! (v4 sabitlemesi sayesinde express4 %100 çalışır)
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { appointmentTypeDef } from "./graphql/typedefs/appointment.typeDef.js";
import { customerTypeDef } from "./graphql/typedefs/customer.typeDef.js";
import { productTypeDef } from "./graphql/typedefs/product.typeDef.js";
import { saleTypeDef } from "./graphql/typedefs/sale.typeDef.js";
import { staffTypeDef } from "./graphql/typedefs/staff.typeDef.js";
import { tenantTypeDef } from "./graphql/typedefs/tenant.typeDef.js";
import { dashboardTypeDef } from "./graphql/typedefs/dashboard.typeDef.js";
import { userTypeDef } from "./graphql/typedefs/user.typeDef.js";
import { commonTypeDef } from "./graphql/typedefs/common.typeDef.js";

import { resolvers } from "./graphql/resolvers.js";

import { createContext } from "./context/context.js";

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

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  cors(),
  express.json(), // 🚨 body-parser'a gerek yok, Express'in kendi neşterini kullanıyoruz
  expressMiddleware(server, {
    // 🚨 YENİ: createContext'e sadece req değil, yukarıda kurduğumuz io telsizini de yolluyoruz!
    context: async ({ req }) => await createContext({ req, io }),
  }) as any,
);

// 🚨 SUNUCUNUN HAFIZASI
// Hangi telsiz (socket.id), hangi hastanede (tenantId), hangi dosyayı (recordId) kilitledi?
const lockedRecords = new Map();

io.on("connection", (socket) => {
  console.log("🚀 Client connected to Socket.io! ID:", socket.id);

  socket.on("join_tenant_room", (tenantId) => {
    socket.join(tenantId);
    console.log(`🏥 The radio joined room number ${socket.id}, [${tenantId}]!`);
  });

  // 🔒 1. DÜZENLEME BAŞLADI (KİLİTLE)
  socket.on("lock_record", ({ tenantId, recordId, userEmail }) => {
    // Hafızaya yaz: "Bu adam, bu dosyayı ameliyata aldı!"
    lockedRecords.set(socket.id, { tenantId, recordId });
    socket.broadcast
      .to(tenantId)
      .emit("record_locked", { recordId, lockedBy: userEmail });
  });

  // 🔓 2. DÜZENLEME BİTTİ (KİLİDİ AÇ)
  socket.on("unlock_record", ({ tenantId, recordId }) => {
    // İş bitti, dosyayı hafızadan sil
    lockedRecords.delete(socket.id);
    socket.broadcast.to(tenantId).emit("record_unlocked", { recordId });
  });

  // 🚨 3. İNTERNET KOPTUĞUNDA ÇALIŞAN "HAYAT KURTARAN" KOD (Disconnect)
  socket.on("disconnect", () => {
    console.log(" Client disconnected.", socket.id);

    // Eğer interneti kopan adamın elinde kilitli bir dosya varsa:
    if (lockedRecords.has(socket.id)) {
      const { tenantId, recordId } = lockedRecords.get(socket.id);

      // Herkese otomatik anons geç: "Adamın neti gitti, kilidi kırın!"
      socket.broadcast.to(tenantId).emit("record_unlocked", { recordId });

      // Temizlik yap
      lockedRecords.delete(socket.id);
      console.log(`🔌 Internet dropped! Auto-unlocked record: ${recordId}`);
    }
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`✅ LuxeLogic Server ready!`);
  console.log(`🚀 GraphQL: http://localhost:${PORT}/graphql`);
});
