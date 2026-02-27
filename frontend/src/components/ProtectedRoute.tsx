import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // localStorage'da token olup olmadığına bakıyoruz
  const token = localStorage.getItem("token");

  // Eğer token yoksa, kullanıcıyı zorla Giriş (Signin) sayfasına fırlatıyoruz
  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  // Eğer token varsa, gitmek istediği sayfayı (children) gösteriyoruz
  return children;
};

export default ProtectedRoute;
