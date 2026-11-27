import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    // Bütün test dosyaları aynı veritabanını kullanıyor; aynı anda çalışırlarsa
    // birinin temizliği diğerinin verisini siler. O yüzden dosyalar sırayla çalışır.
    fileParallelism: false,
  },
});
