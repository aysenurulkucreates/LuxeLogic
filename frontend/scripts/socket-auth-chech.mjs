// Kullanım: node scripts/socket-auth-check.mjs [token] [hedefTenantId] [hedefRecordId]
import { io } from "socket.io-client";

const [token, targetTenantId, targetRecordId] = process.argv.slice(2);
const socket = io("http://localhost:4000", { auth: { token } });

socket.on("connect", () => {
  console.log("CONNECTED:", socket.id);

  if (targetTenantId) {
    // Eski saldırı: başka kliniğin odasına girmeye ve sahte kilit atmaya çalış
    socket.emit("join_tenant_room", targetTenantId);
    socket.emit("lock_record", {
      tenantId: targetTenantId,
      recordId: targetRecordId,
      userEmail: "fake@example.com",
    });
    console.log("Sent old-style join + fake lock for tenant:", targetTenantId);
  }
});

socket.on("connect_error", (err) => {
  console.log("REJECTED:", err.message);
  process.exit(0);
});

// Bu socket'e gelen her olayı yazdır
socket.onAny((event, ...args) => {
  console.log("EVENT:", event, JSON.stringify(args));
});
