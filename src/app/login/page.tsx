import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={88} />
          <h1 className="mt-3 text-2xl font-black text-brand-700">
            Trà sữa tích điểm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khu vực nhân viên &amp; quản lý 🧋
          </p>
        </div>

        <Suspense
          fallback={
            <div className="card text-center text-sm text-slate-400">
              Đang tải…
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} TUIBAO. Nội bộ.
        </p>
      </div>
    </main>
  );
}
