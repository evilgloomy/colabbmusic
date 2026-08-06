import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/store/CartDrawer";
import { useTranslation } from "react-i18next";
import { SocialIcon } from "@/lib/socialIcons";
import { socialLinks } from "@/data/content";
import { trackSocialClick, trackLanguageChange } from "@/lib/analytics";

const NAV: { key: string; path: string }[] = [
  { key: "music", path: "/music" },
  { key: "world", path: "/story" },
  { key: "videos", path: "/videos" },
  { key: "store", path: "/store" },
  { key: "about", path: "/about-cola" },
  { key: "chat", path: "/chat" },
];

interface NavbarProps {
  /** Overlay the hero until the user scrolls. */
  transparent?: boolean;
}

export const Navbar = ({ transparent }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const solid = !transparent || scrolled || mobileOpen;

  const toggleLang = () => {
    const next = i18n.language?.startsWith("zh") ? "en" : "zh-HK";
    i18n.changeLanguage(next);
    trackLanguageChange(next);
  };
  const langLabel = i18n.language?.startsWith("zh") ? "EN" : "繁";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid ? "bg-cola-ink/85 backdrop-blur-xl border-b border-cola-pearl/10" : "bg-transparent"
      }`}
    >
      <div className="editorial h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-xl tracking-[0.16em] uppercase text-cola-pearl mr-10"
          onClick={() => setMobileOpen(false)}
        >
          Cola B
        </Link>

        <div className="hidden md:flex items-center gap-7 flex-1">
          {NAV.map(({ key, path }) => {
            const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
            return (
              <Link
                key={key}
                to={path}
                className={`text-[0.7rem] font-semibold tracking-[0.22em] uppercase transition-colors ${
                  active ? "text-cola-pink" : "text-cola-pearl/65 hover:text-cola-pearl"
                }`}
              >
                {t(`nav.${key}`)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 text-[0.7rem] font-semibold tracking-[0.16em] text-cola-pearl/70 hover:text-cola-pearl border border-cola-pearl/20 hover:border-cola-pearl/50 transition-colors"
          >
            {langLabel}
          </button>
          <CartDrawer />
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            onClick={() => trackSocialClick("instagram", "navbar")}
            className="hidden md:flex text-cola-pearl/65 hover:text-cola-pearl transition-colors"
          >
            <SocialIcon platform="instagram" className="h-4 w-4" />
          </a>
          <button
            className="md:hidden text-cola-pearl min-h-11 min-w-11 flex items-center justify-end"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-cola-ink/97 backdrop-blur-xl border-t border-cola-pearl/10">
          <div className="editorial py-8 flex flex-col gap-6">
            {NAV.map(({ key, path }) => (
              <Link
                key={key}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`font-display text-2xl ${
                  location.pathname === path ? "text-cola-pink" : "text-cola-pearl"
                }`}
              >
                {t(`nav.${key}`)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
