import { ReactNode } from "react";
import { Link } from "react-router-dom";
import sealImg from "@/aipf/assets/aipf-seal.png";
import { useAipfT, AipfLanguageSwitcher } from "@/aipf/i18n";

export function SealLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={sealImg}
      alt="AI People Foundation seal"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return <div className={`aipf-gold-divider w-16 ${className}`} />;
}

export function ThinDivider({ className = "" }: { className?: string }) {
  return <div className={`aipf-thin-divider w-full ${className}`} />;
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`aipf-label ${className}`}>{children}</div>;
}

export function InstitutionalFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`aipf-frame p-8 ${className}`}>{children}</div>;
}

export function InstitutionalHeader() {
  const { t } = useAipfT();
  const nav = [
    { to: "/aipf", label: t("nav.home") },
    { to: "/aipf/about", label: t("nav.about") },
    { to: "/aipf/directory", label: t("nav.directory") },
    { to: "/aipf/founding-cohort-2026", label: t("nav.founding") },
    { to: "/aipf/programs", label: t("nav.programs") },
    { to: "/aipf/journal", label: t("nav.journal") },
    { to: "/aipf/contact", label: t("nav.contact") },
  ];
  return (
    <header className="border-b" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="border-b" style={{ borderColor: "hsl(var(--ceremonial-gold) / 0.4)" }}>
        <div className="container mx-auto px-6 h-8 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.22em]" style={{ color: "hsl(var(--muted-ink))" }}>
          <span>{t("header.mmxxvi")}</span>
          <div className="flex items-center gap-6">
            <AipfLanguageSwitcher />
            <Link to="/" className="hover:text-foreground transition-colors">{t("header.backCola")}</Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
        <Link to="/aipf" className="flex items-center gap-4">
          <SealLogo size={56} />
          <div>
            <div className="font-institutional text-2xl leading-none">{t("header.orgName")}</div>
            <div className="aipf-label mt-2">{t("header.tagline")}</div>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-ui">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-foreground/70 hover:text-foreground transition-colors uppercase tracking-[0.14em] text-xs"
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/aipf/register-interest"
            className="px-4 py-2 text-xs uppercase tracking-[0.16em] border"
            style={{
              borderColor: "hsl(var(--foundation-navy))",
              background: "hsl(var(--foundation-navy))",
              color: "hsl(var(--institution-white))",
            }}
          >
            {t("nav.register")}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function AipfFooter() {
  const { t } = useAipfT();
  return (
    <footer className="mt-24 aipf-navy">
      <div className="container mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-3">
            <SealLogo size={44} />
            <div className="font-institutional text-xl">{t("header.orgName")}</div>
          </div>
          <p className="mt-4 text-sm opacity-70 max-w-xs">{t("footer.blurb")}</p>
        </div>
        <div>
          <div className="aipf-label mb-3">{t("footer.foundation")}</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/aipf/about" className="hover:opacity-100">{t("nav.about")}</Link></li>
            <li><Link to="/aipf/founding-cohort-2026" className="hover:opacity-100">{t("nav.founding")}</Link></li>
            <li><Link to="/aipf/programs" className="hover:opacity-100">{t("nav.programs")}</Link></li>
            <li><Link to="/aipf/journal" className="hover:opacity-100">{t("nav.journal")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="aipf-label mb-3">{t("footer.participate")}</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/aipf/directory" className="hover:opacity-100">{t("nav.directory")}</Link></li>
            <li><Link to="/aipf/register-interest" className="hover:opacity-100">{t("nav.register")}</Link></li>
            <li><Link to="/aipf/nominate" className="hover:opacity-100">{t("nav.nominate")}</Link></li>
            <li><Link to="/aipf/contact" className="hover:opacity-100">{t("nav.contact")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: "hsl(var(--ceremonial-gold) / 0.3)" }}>
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-xs opacity-60 gap-2">
          <span>© {new Date().getFullYear()} {t("footer.copyright")}</span>
          <Link to="/" className="hover:opacity-100">{t("footer.return")}</Link>
        </div>
      </div>
    </footer>
  );
}
