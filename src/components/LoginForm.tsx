"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginIdToEmail } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginIdToEmail(loginId),
      password,
    });

    if (error) {
      setError("ID đăng nhập hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }

    // Điều hướng theo vai trò
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let dest = params.get("next") || "/staff";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin" && !params.get("next")) dest = "/admin";
    }
    router.replace(dest);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="card space-y-4">
      <div>
        <label className="label" htmlFor="loginId">
          ID đăng nhập
        </label>
        <input
          id="loginId"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="input"
          placeholder="vd: nv001"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
