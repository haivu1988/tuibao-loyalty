import Link from "next/link";
import Logo from "./Logo";
import LogoutButton from "./LogoutButton";

interface NavLink {
  href: string;
  label: string;
}

export default function Navbar({
  title,
  links = [],
  userName,
}: {
  title: string;
  links?: NavLink[];
  userName?: string | null;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-5xl px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-black text-brand-700">{title}</p>
              {userName && (
                <p className="truncate text-xs text-slate-400">
                  Xin chào, {userName} 🧋
                </p>
              )}
            </div>
          </Link>
          <LogoutButton />
        </div>

        {links.length > 0 && (
          <nav className="no-scrollbar -mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 whitespace-nowrap rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 active:bg-brand-100"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
