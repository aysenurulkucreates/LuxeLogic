import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { SIGNUP_MUTATION } from "../../graphql/mutations/Auth";
import { useNavigate } from "react-router-dom";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [signupUser, { loading }] = useMutation(SIGNUP_MUTATION, {
    onCompleted: (data) => {
      const { token } = data.signup;
      localStorage.setItem("token", token);
      navigate("/signin");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signupUser({
        variables: {
          credentials: { email, password },
          tenantName,
          slug,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-7xl w-full flex bg-white rounded-3xl shadow-2xl overflow-hidden m-4">
        {/* SOL TARAF: Görsel ve Karşılama (Signin ile tutarlı) */}
        <div className="w-1/2 bg-blue-600 p-12 flex flex-col justify-between text-white relative">
          {/* Arka plan görseli ve mavi overlay buraya gelecek (Tailwind ile bg-image veya img tag) */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4">LuxeLogic</h1>
            <p className="text-xl">
              Create and start managing your own clinic or company in seconds.
            </p>
          </div>
          <div className="relative z-10 mt-20">
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
              Join Us!
            </h2>
            <p className="text-lg opacity-80">
              You are just a few steps away from launching your CRM experience.
            </p>
          </div>
          {/* Buraya örnek bir görsel overlay eklenebilir */}
          <img
            src="/public/images/clinic.png"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            alt="Clinic"
          />
        </div>

        {/* SAĞ TARAF: Signup Formu */}
        <div className="w-1/2 p-16 flex flex-col justify-center">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">
              Enter your company and user information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hata Mesajı Alanı */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                ⚠️ {error}
              </div>
            )}

            {/* Şirket / Klinik Adı */}
            <div className="space-y-1">
              <label
                htmlFor="tenantName"
                className="text-sm font-medium text-gray-700"
              >
                Company / Clinic Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  {/* Building/Hospital Icon */}
                  🏢
                </span>
                <input
                  id="tenantName"
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Enter your clinic name."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Sistem Adresi (Slug) */}
            <div className="space-y-1">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-gray-700"
              >
                System Address (Slug)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  {/* Link Icon */}
                  🔗
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-clinic-name"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 pl-1">
                Example:{" "}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  luxelogic.com/your-clinic-name
                </span>
              </p>
            </div>

            {/* E-posta Adresi (Signin ile tutarlı) */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                E-mail Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  {/* Mail Icon */}
                  ✉️
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Şifre (Signin ile tutarlı) */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  {/* Lock Icon */}
                  🔒
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Kayıt Ol Butonu */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {loading ? "Being recorded..." : "Signup"}
              </button>
            </div>
          </form>

          {/* Giriş Yap Linki */}
          <div className="mt-10 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-500 transition"
              >
                Signin
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
