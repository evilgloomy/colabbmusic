import { ReactNode, useState } from "react";
import { NavLink, Navigate, useLocation, Link } from "react-router-dom";
import { useAipfAuth } from "@/aipf/AipfAuthContext";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SealLogo } from "@/aipf/components/Chrome";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/aipf/admin", label: "Overview", exact: true },
  { to: "/aipf/admin/interest", label: "Interest" },
  { to: "/aipf/admin/nominations", label: "Nominations" },
  { to: "/aipf/admin/invitations", label: "Invitations" },
  { to: "/aipf/admin/onboarding", label: "Onboarding" },
  { to: "/aipf/admin/directory", label: "Directory" },
  { to: "/aipf/admin/broken-links", label: "Broken Links" },
  { to: "/aipf/admin/journal", label: "Journal" },
];

export function AdminGuard({ children }: { children: ReactNode }) {
  const { session, role, loading } = useAipfAuth();
  const loc = useLocation();
  if (loading) {
    return <AipfLayout hideChrome><div className="p-16 text-center">Loading…</div></AipfLayout>;
  }
  if (!session) {
    return <Navigate to="/aipf/admin/login" replace state={{ from: loc.pathname }} />;
  }
  if (role !== "admin" && role !== "reviewer") {
    return (
      <AipfLayout>
        <div className="container mx-auto px-6 py-24 max-w-lg text-center">
          <div className="aipf-frame p-10">
            <h2 className="font-institutional text-3xl">Access denied</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              This account is signed in but does not have an AIPF admin or reviewer role.
              Contact the Foundation to have your role assigned.
            </p>
          </div>
        </div>
      </AipfLayout>
    );
  }
  return <>{children}</>;
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAipfAuth();
  const [open, setOpen] = useState(false);
  return (
    <div className="aipf-root min-h-screen flex">
      <aside className={`${open ? "block" : "hidden"} md:block w-64 shrink-0 aipf-navy text-white`}>
        <div className="p-6 flex items-center gap-3">
          <SealLogo size={36} />
          <div>
            <div className="font-institutional text-lg leading-none">AIPF</div>
            <div className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70 mt-1">Admin</div>
          </div>
        </div>
        <nav className="px-3 mt-4 flex flex-col gap-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.exact}
              className={({ isActive }) =>
                `px-3 py-2 text-xs uppercase tracking-[0.14em] rounded-none ${
                  isActive ? "bg-[hsl(var(--ceremonial-gold))] text-[hsl(var(--foundation-navy))]" : "opacity-75 hover:opacity-100 hover:bg-white/5"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 mt-8 text-xs opacity-70 border-t border-white/10">
          <div className="truncate">{user?.email}</div>
          <button onClick={signOut} className="mt-2 underline underline-offset-4">Sign out</button>
        </div>
        <div className="p-4">
          <Link to="/aipf" className="text-xs opacity-70 hover:opacity-100">← Public site</Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="md:hidden p-3 border-b flex justify-between">
          <button onClick={() => setOpen(!open)} className="text-xs">Menu</button>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
