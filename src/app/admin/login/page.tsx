"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientAuth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Rate limiting countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0 || loading) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Firebase Client Auth
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await userCredential.user.getIdToken(true);

      // 2. Exchange token for httpOnly session cookie with admin claim check
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Admin claim required.");
      }

      // Success
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials or permission denied.";
      setError(message);

      // Increment failed attempt counter for rate limiting
      const attempts = parseInt(sessionStorage.getItem("admin_login_attempts") || "0", 10) + 1;
      sessionStorage.setItem("admin_login_attempts", String(attempts));

      if (attempts >= 5) {
        setCooldownSeconds(60);
        sessionStorage.setItem("admin_login_attempts", "0");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="border border-[var(--border-color)] rounded bg-[var(--bg-surface)] p-6 sm:p-8">
        <div className="text-center pb-6 border-b border-[var(--border-color)] mb-6">
          <div className="w-10 h-10 mx-auto mb-3 border border-[var(--border-color)] bg-[var(--bg-main)] rounded flex items-center justify-center text-[var(--text-primary)]">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Bilbili Admin Portal
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Sign in with administrative credentials to manage curriculum and articles.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 rounded text-red-800 dark:text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {cooldownSeconds > 0 && (
          <div className="mb-6 p-3 border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] rounded text-[var(--callout-warning-text)] text-xs">
            Too many failed attempts. Please wait {cooldownSeconds} seconds before trying again.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bilbili.edu"
                className="w-full h-10 pl-9 pr-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-9 pr-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || cooldownSeconds > 0}
              className="w-full h-10 flex items-center justify-center gap-2 text-sm font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Admin</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
          Need admin access? Run <code className="font-mono bg-[var(--bg-main)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">node scripts/set-admin.js &lt;email&gt;</code> to grant the claim.
        </div>
      </div>
    </div>
  );
}
