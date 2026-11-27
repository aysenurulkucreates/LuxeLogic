// Her test dosyasından önce çalışır.
// Emniyet kemeri: testler yanlışlıkla geliştirme veritabanına bağlanırsa
// resetDb oradaki bütün veriyi siler. Bu yüzden adres test veritabanı değilse dur.
if (!process.env.DATABASE_URL?.includes("luxelogic_test")) {
  throw new Error(
    "Tests must run against the luxelogic_test database. Check .env.test.",
  );
}
