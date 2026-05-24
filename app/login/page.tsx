"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const { signIn, signUp, loading: authLoading, configured } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    if (mode === "login") {
      const { error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError(signInError);
        setSubmitting(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } else {
      const { error: signUpError } = await signUp(
        email.trim(),
        password,
        fullName.trim() || undefined
      );
      if (signUpError) {
        setError(signUpError);
        setSubmitting(false);
        return;
      }
      setInfo(
        "Konto oprettet. Tjek din e-mail for bekræftelse, og log derefter ind."
      );
      setMode("login");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-work-blue">
            Kemisk APV
          </p>
          <h1 className="mt-2 text-3xl font-bold text-work-navy">Log ind</h1>
          <p className="mt-2 text-sm text-gray-600">
            Medarbejdere og administratorer logger ind med Supabase Auth.
          </p>
        </div>

        <div className="mb-4 flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
              mode === "login" ? "bg-work-navy text-white" : "text-gray-600"
            }`}
          >
            Log ind
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
              mode === "signup" ? "bg-work-navy text-white" : "text-gray-600"
            }`}
          >
            Opret konto
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {mode === "signup" && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-semibold text-work-navy"
              >
                Navn (valgfrit)
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-semibold text-work-navy"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-semibold text-work-navy"
            >
              Adgangskode
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-work-navy text-lg font-semibold text-white active:bg-work-blue disabled:opacity-60"
          >
            {submitting
              ? "Vent…"
              : mode === "login"
                ? "Log ind"
                : "Opret konto"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Admin-adgang tildeles automatisk til{" "}
          <span className="font-mono">rasmus.berthel@gmail.com</span>
        </p>

        {!configured && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
            Supabase er ikke konfigureret. Kopier{" "}
            <span className="font-mono">.env.example</span> til{" "}
            <span className="font-mono">.env.local</span> og udfyld URL + anon key.
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-gray-600">
          Indlæser…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
