export default function StatCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "green" | "blue" | "slate";
}) {
  const accents: Record<string, string> = {
    brand: "text-brand-600",
    green: "text-emerald-600",
    blue: "text-blue-600",
    slate: "text-slate-700",
  };

  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accents[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
