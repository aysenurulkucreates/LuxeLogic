import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { SIGNUP_MUTATION } from "../../graphql/mutations/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getHomePath } from "../../config/permissions";
import { UserPlus, Building2, Link2, Mail, Lock } from "lucide-react";
import Button from "../../components/ui/Button";

const Signup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tenantName, setTenantName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [signupUser, { loading }] = useMutation(SIGNUP_MUTATION, {
    onCompleted: (data) => {
      const { token, user } = data.signup;
      login(token);
      navigate(getHomePath(user.role));
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-7xl w-full flex bg-white rounded-2xl shadow-2xl overflow-hidden m-4">
        {/* SOL TARAF: Görsel ve Karşılama (Signin ile tutarlı) */}
        <div className="w-1/2 bg-indigo-600 p-12 flex flex-col justify-between text-white relative">
          {/* Arka plan görseli ve mavi overlay buraya gelecek (Tailwind ile bg-image veya img tag) */}
          <div className="relative z-10">
            {/* Marka adı; sayfanın H1'i sağdaki form başlığı */}
            <p className="text-4xl font-bold mb-4">LuxeLogic</p>
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
            src="/images/clinic.png"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            alt=""
          />
        </div>

        {/* SAĞ TARAF: Signup Formu */}
        <div className="w-1/2 p-16 flex flex-col justify-center">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              Create account
            </h1>
            <p className="text-slate-600 mt-2">
              Enter your company and user information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hata Mesajı Alanı */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Şirket / Klinik Adı */}
            <div className="space-y-1">
              <label
                htmlFor="tenantName"
                className="text-sm font-medium text-slate-700"
              >
                Company / Clinic Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  {/* Building/Hospital Icon */}
                  <Building2 size={18} />
                </span>
                <input
                  id="tenantName"
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Enter your clinic name."
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Sistem Adresi (Slug) */}
            <div className="space-y-1">
              <label
                htmlFor="slug"
                className="text-sm font-medium text-slate-700"
              >
                System Address (Slug)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  {/* Link Icon */}
                  <Link2 size={18} />
                </span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-clinic-name"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-1">
                Example:{" "}
                <span className="font-mono bg-slate-100 px-1 rounded-lg">
                  luxelogic.com/your-clinic-name
                </span>
              </p>
            </div>

            {/* E-posta Adresi (Signin ile tutarlı) */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                E-mail Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  {/* Mail Icon */}
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Şifre (Signin ile tutarlı) */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  {/* Lock Icon */}
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Kayıt Ol Butonu */}
            <div>
              <Button
                type="submit"
                icon={UserPlus}
                isLoading={loading}
                className="w-full"
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </form>

          {/* Giriş Yap Linki */}
          <div className="mt-10 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <a
                href="/signin"
                className="font-medium text-indigo-600 hover:text-indigo-700 transition"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
