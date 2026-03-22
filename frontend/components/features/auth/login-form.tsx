"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PasswordInput } from "./password-input";
import { login } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import apiClient from "@/lib/api/client";
import { User } from "@/lib/types/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.login");
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const justRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokens = await login({ email, password });

      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);

      const { data: user } = await apiClient.get<User>("/users/me");
      setAuth(user, tokens.access_token, tokens.refresh_token);

      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif text-white">{t("title")}</h2>
        <p className="mt-1.5 text-stone-400 text-sm">{t("subtitle")}</p>
      </div>

      {justRegistered && (
        <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{t("registered")}</p>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-stone-300 block">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex w-full h-11 rounded-lg border border-stone-700 bg-stone-900/50 px-4 text-sm text-stone-200 outline-none placeholder:text-stone-600 transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-stone-300 block">
            {t("password")}
          </label>
          <PasswordInput
            id="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-amber-500 text-stone-950 font-medium text-sm tracking-wide hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("submitting")}
            </span>
          ) : (
            t("submit")
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-800">
        <p className="text-sm text-center text-stone-500">
          {t("noAccount")}{" "}
          <a href="/register" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
            {t("createAccount")}
          </a>
        </p>
      </div>
    </div>
  );
}
