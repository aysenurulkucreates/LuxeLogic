import { RateLimiterMemory } from "rate-limiter-flexible";
import { tooManyRequests } from "./errors.js";

const MAX_PER_EMAIL_IP = 5; // tek hesaba yapılan tahmin
const MAX_PER_IP = 50; // aynı IP'den çok sayıda e-posta denemesi

const byEmailAndIp = new RateLimiterMemory({
  keyPrefix: "login_email_ip",
  points: MAX_PER_EMAIL_IP,
  duration: 15 * 60, // saniye: 15 dakika
});

const byIp = new RateLimiterMemory({
  keyPrefix: "login_ip",
  points: MAX_PER_IP,
  duration: 60 * 60, // 1 saat
});

// "Elif@Mail.com" ile "elif@mail.com" aynı sayaca düşsün
const emailIpKey = (email: string, ip: string) =>
  `${email.trim().toLowerCase()}_${ip}`;

// 1) En başta: engelliyse hiç devam etme
export const assertLoginAllowed = async (email: string, ip: string) => {
  const [emailIpRes, ipRes] = await Promise.all([
    byEmailAndIp.get(emailIpKey(email, ip)),
    byIp.get(ip),
  ]);

  let retryMs = 0;
  if (emailIpRes && emailIpRes.consumedPoints >= MAX_PER_EMAIL_IP) {
    retryMs = emailIpRes.msBeforeNext;
  }
  if (ipRes && ipRes.consumedPoints >= MAX_PER_IP) {
    retryMs = Math.max(retryMs, ipRes.msBeforeNext);
  }

  if (retryMs > 0) throw tooManyRequests(Math.ceil(retryMs / 1000));
};

// 2) Hatalı denemede: iki sayacı da bir artır
export const recordFailedLogin = async (email: string, ip: string) => {
  // consume sınır aşılınca reject ediyor; burada önemli değil, zaten hata fırlatacağız
  await Promise.allSettled([
    byEmailAndIp.consume(emailIpKey(email, ip)),
    byIp.consume(ip),
  ]);
};

// 3) Doğru girişte: o e-postanın sayacını sıfırla (IP sayacı kalıyor)
export const resetLoginAttempts = async (email: string, ip: string) => {
  await byEmailAndIp.delete(emailIpKey(email, ip));
};
