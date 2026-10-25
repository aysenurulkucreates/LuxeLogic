// Sadece süresi geçmiş mi diye bakar, imzayı doğrulamaz (doğrulama backend'in işi).
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof exp !== "number") return true;
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// Aynı anda birden fazla istek hata verirse yönlendirme tek kez çalışsın.
let redirecting = false;

export const endSession = () => {
  if (redirecting) return;
  // Zaten çıkış yapmış kullanıcıda (ör. giriş sayfası) yönlendirme döngüsü olmasın.
  if (!localStorage.getItem("token")) return;

  redirecting = true;
  localStorage.removeItem("token");
  // Tam sayfa yönlendirme: Apollo cache, socket ve AuthContext temiz başlasın.
  window.location.assign("/signin?expired=1");
};
