import { useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

// Tüm sayfaların paylaştığı tek bağlantı. autoConnect kapalı: bağlantı ancak
// bir component useSocket ile abone olunca açılır.
const socket = io(SOCKET_URL, { autoConnect: false });

// Kaç component'in bağlantıyı kullandığını sayıyoruz; son kullanıcı
// unmount olunca bağlantı kapanır.
let subscriberCount = 0;

export const useSocket = (tenantId?: string) => {
  useEffect(() => {
    subscriberCount += 1;
    if (subscriberCount === 1) socket.connect();

    return () => {
      subscriberCount -= 1;
      if (subscriberCount === 0) socket.disconnect();
    };
  }, []);

  // Tenant odasına katıl; yeniden bağlanmada oda üyeliği düştüğü için
  // her "connect" olayında tekrar katılıyoruz.
  useEffect(() => {
    if (!tenantId) return;

    const joinTenantRoom = () => socket.emit("join_tenant_room", tenantId);
    if (socket.connected) joinTenantRoom();
    socket.on("connect", joinTenantRoom);

    return () => {
      socket.off("connect", joinTenantRoom);
    };
  }, [tenantId]);

  return socket;
};
