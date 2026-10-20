import { useMutation } from "@apollo/client";
import { SIGNIN_MUTATION } from "../../graphql/mutations/auth";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getHomePath } from "../../config/permissions";
import { LogIn } from "lucide-react";
import Button from "../../components/ui/Button";

const Signin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signinUser, { loading, error }] = useMutation(SIGNIN_MUTATION, {
    onCompleted: (data) => {
      login(data.signin.token);
      navigate(getHomePath(data.signin.user.role));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signinUser({
      variables: {
        credentials: {
          email: email,
          password: password,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        {/* Logo ve Başlık Bölümü */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-lg mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to your LuxeLogic account
          </p>
        </div>

        {/* Giriş Formu */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700 text-sm font-medium">
                Error: {error.message}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              E-mail Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="ayse@clinic.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            icon={LogIn}
            isLoading={loading}
            className="w-full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Don't have an account yet?{" "}
          <a
            href="/signup"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signin;
