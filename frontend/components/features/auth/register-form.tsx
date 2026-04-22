"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { register } from "@/lib/api/auth";
import { getApiErrorCode } from "@/lib/api/client";
import { AuthField } from "@/components/features/ui/auth-field";
import { PasswordStrength } from "@/components/features/ui/password-strength";

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tErr = useTranslations("auth.errors");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
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
      <div className="mb-8">
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.5px] text-qs-fg">
          {t("title")}
        </h2>
        <p className="mt-1.5 text-[13px] text-qs-fg-subtle">{t("subtitle")}</p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.10)] px-4 py-3">
          <p className="text-[13px] text-qs-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          label={t("name")}
          type="text"
          name="name"
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <AuthField
          label={t("email")}
          type="email"
          name="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div>
          <AuthField
            label={t("password")}
            type={pwVisible ? "text" : "password"}
            name="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            rightSlot={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setPwVisible((v) => !v)}
                className="rounded p-1 text-qs-fg-faint hover:text-qs-fg-muted"
              >
                {pwVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          {password.length > 0 && (
            <PasswordStrength password={password} className="mt-2" />
          )}
        </div>

        <AuthField
          label={t("confirmPassword")}
          type={confirmVisible ? "text" : "password"}
          name="confirmPassword"
          placeholder={t("confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          error={
            confirmPassword && confirmPassword !== password
              ? t("passwordMismatch")
              : undefined
          }
          rightSlot={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setConfirmVisible((v) => !v)}
              className="rounded p-1 text-qs-fg-faint hover:text-qs-fg-muted"
            >
              {confirmVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-qs-amber text-[13px] font-semibold tracking-[0.1px] text-[#0c0a09] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_0_0_1px_rgba(245,158,11,0.3),0_4px_14px_rgba(245,158,11,0.25)] transition-colors hover:bg-qs-amber-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-qs-line pt-6 text-center">
        <p className="text-[13px] text-qs-fg-faint">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-qs-amber-bright transition-colors hover:text-qs-amber"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
