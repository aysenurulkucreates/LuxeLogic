1. Backend (The Brain)
   Klasörüne gir (cd backend), npm init -y yaptıktan sonra şunları yapıştır:

Çekirdek Yapı: npm install @apollo/server graphql (Laith Harb usulü, motorumuz bu).

Veritabanı (Prisma): npm install prisma --save-dev ve ardından npm install @prisma/client (SQL ile aramızdaki köprü).

Güvenlik & Ayar: npm install dotenv jsonwebtoken bcryptjs cors (Şifreleme, token ve ortam değişkenleri için).

Development: npm install nodemon --save-dev (Kod değiştikçe server kendi kendine reset atsın).

2. Frontend (The Face)
   Klasörüne gir (cd frontend), eğer React’ı Vite ile kuracaksan (npm create vite@latest .) ardından şunları ekle:

Veri İletişimi: npm install @apollo/client graphql (Backend'deki GraphQL ile konuşmak için).

Navigasyon: npm install react-router-dom (Sayfalar arası geçiş).

Şıklık (Luxe Görünüm): npm install lucide-react (Çok havalı ve temiz ikonlar için).

Styling: Ben senin yerinde olsam Tailwind CSS kullanırım, hem çok hızlı hem de profesyonel duruyor.
