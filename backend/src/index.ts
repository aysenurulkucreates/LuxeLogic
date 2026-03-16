import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

// 🚨 Apollo'yu artık modern ESM ile çağırıyoruz! (v4 sabitlemesi sayesinde express4 %100 çalışır)
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { typeDefs } from "./graphql/typeDefs.js";
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

io.on("connection", (socket) => {
  console.log("🚀 Client connected to Socket.io! ID:", socket.id);

  // 🚨 YENİ: Frontend "Ben geldim, benim şirket kodum bu" dediğinde onu odaya alıyoruz!
  socket.on("join_tenant_room", (tenantId) => {
    socket.join(tenantId);
    console.log(`🏥 The radio joined room number ${socket.id}, [${tenantId}]!`);
  });

  socket.on("disconnect", () => {
    console.log(" Client disconnected.");
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`✅ LuxeLogic Server ready!`);
  console.log(`🚀 GraphQL: http://localhost:${PORT}/graphql`);
});
