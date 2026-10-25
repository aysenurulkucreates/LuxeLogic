import { useEffect } from "react";
import { io } from "socket.io-client";
import { endSession } from "../lib/session";

const SOCKET_URL = "http://localhost:4000";

// Tüm sayfaların paylaştığı tek bağlantı. autoConnect kapalı: bağlantı ancak
// bir component useSocket ile abone olunca açılır.
// auth bir fonksiyon: her bağlanmada ve yeniden bağlanmada güncel token'ı okur.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});

socket.on("connect_error", (err) => {
  console.warn("Socket connection rejected:", err.message);
  // Sunucu kapalı gibi kimlikle ilgisiz hatalarda oturum kapanmaz.
  if (err.message === "UNAUTHENTICATED") endSession();
});

// Kaç component'in bağlantıyı kullandığını sayıyoruz; son kullanıcı
// unmount olunca bağlantı kapanır.
let subscriberCount = 0;

export const useSocket = () => {
  useEffect(() => {
    subscriberCount += 1;
    if (subscriberCount === 1) socket.connect();

    return () => {
      subscriberCount -= 1;
      if (subscriberCount === 0) socket.disconnect();
    };
  }, []);

  return socket;
};
