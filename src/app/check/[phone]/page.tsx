import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import type { CustomerCheckResult } from "@/types";

export const dynamic = "force-dynamic";

export default async function CheckPage({
  params,
}: {
  params: { phone: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.rpc("customer_check", {
    p_phone: decodeURIComponent(params.phone),
  });

  const result = (data as CustomerCheckResult) || { found: false };

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={72} />
          <p className="mt-2 text-sm font-semibold text-brand-700">
            Thẻ thành viên trà sữa 🧋
          </p>
        </div>

        {!result.found ? (
          <div className="card text-center">
            <p className="text-slate-700">
              Chưa tìm thấy thành viên với số điện thoại này.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Ghé quầy TUIBAO mua & tích tick để mở thẻ thành viên nhé!
            </p>
          </div>
        ) : (
          <>
            {/* Thẻ tick */}
            <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[0_18px_40px_-16px_rgba(48,108,32,0.6)]">
              <div className="pointer-events-none absolute -right-6 -top-8 text-8xl opacity-20">
                🧋
              </div>
              <p className="text-sm opacity-90">
                {result.full_name || "Thành viên TUIBAO"}
              </p>
              <p className="text-base font-semibold tracking-wide">
                {result.phone}
              </p>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-black leading-none drop-shadow">
                  {result.ticks ?? 0}
                </span>
                <span className="mb-1.5 rounded-full bg-sun-300 px-2 py-0.5 text-xs font-extrabold text-sun-900">
                  TICK
                </span>
              </div>
            </div>

            {/* Mốc quà */}
            <div className="card mt-4">
              <h2 className="mb-3 text-sm font-black text-brand-800">
                🎁 Quà có thể đổi &amp; mốc sắp đạt
              </h2>
              <ul className="space-y-2">
                {(result.gifts ?? []).map((g) => (
                  <li
                    key={g.id}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${
                      g.reached
                        ? "border-brand-300 bg-brand-50"
                        : "border-slate-100"
                    }`}
                  >
                    <GiftThumb url={g.image_url} reached={g.reached} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {g.name}
                      </p>
                      <p className="text-xs text-slate-500">{g.tick_cost} tick</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {g.reached ? (
                        <span className="chip bg-brand-100 text-brand-700">
                          ✓ Đủ đổi{!g.in_stock && " (hết)"}
                        </span>
                      ) : (
                        <span className="chip bg-sun-100 text-sun-800">
                          còn {g.ticks_needed}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {(result.gifts ?? []).length === 0 && (
                  <li className="text-sm text-slate-400">Chưa có quà nào.</li>
                )}
              </ul>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Thẻ thành viên điện tử · TUIBAO
        </p>
      </div>
    </main>
  );
}

/* eslint-disable-next-line @next/next/no-img-element */
function GiftThumb({
  url,
  reached,
}: {
  url?: string | null;
  reached: boolean;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-black/5"
      />
    );
  }
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
        reached ? "bg-brand-100" : "bg-slate-100"
      }`}
    >
      🎁
    </div>
  );
}
