"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Неверные данные");
        return;
      }
      localStorage.setItem("admin_token", data.token);
      router.replace("/admin");
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#F7F0EC" }}
    >
      <div
        className="w-full max-w-sm rounded-xl shadow-lg p-8"
        style={{ background: "#FAFAFA" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="font-prata text-2xl"
            style={{
              color: "#3F1111",
              fontFamily: "var(--font-prata, Georgia, serif)",
            }}
          >
            Андруа Фамиль
          </span>
          <p className="text-sm mt-1" style={{ color: "#9a9a9a" }}>
            Вход в панель управления
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#191E1B" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                borderColor: "#e8e0da",
                background: "#FAFAFA",
                color: "#191E1B",
              }}
              placeholder="admin@andrua-famil.ru"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#191E1B" }}
            >
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                borderColor: "#e8e0da",
                background: "#FAFAFA",
                color: "#191E1B",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: "#c0392b" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium mt-1 transition-opacity disabled:opacity-60"
            style={{ background: "#3F1111", color: "#FAFAFA" }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
