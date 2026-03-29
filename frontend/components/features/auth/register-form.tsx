"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PasswordInput } from "./password-input";
import { register } from "@/lib/api/auth";
import { getApiErrorCode } from "@/lib/api/client";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tErr = useTranslations("auth.errors");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      await register({ email, password, name });
      router.push("/login?registered=true");
    } catch (err: unknown) {
      const code = getApiErrorCode(err);
      setError(tErr.has(code) ? tErr(code) : tErr("unknown"));
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

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-stone-300 block">
            {t("name")}
          </label>
          <input
            id="name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex w-full h-11 rounded-lg border border-stone-700 bg-stone-900/50 px-4 text-sm text-stone-200 outline-none placeholder:text-stone-600 transition-all focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

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

        <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-stone-300 block">
              {t("confirmPassword")}
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
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
          {t("hasAccount")}{" "}
          <a href="/login" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
            {t("signIn")}
          </a>
        </p>
      </div>
    </div>
  );
}
