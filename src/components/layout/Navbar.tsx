import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram } from "lucide-react";
import { CartDrawer } from "@/components/store/CartDrawer";
import { useTranslation } from "react-i18next";

const navKeys = ["home", "music", "story", "videos", "store", "press", "chat"] as const;
const navPaths = ["/", "/music", "/story", "/videos", "/store", "/press", "/chat"];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language?.startsWith("zh") ? "en" : "zh-HK";
    i18n.changeLanguage(next);
  };

  const langLabel = i18n.language?.startsWith("zh") ? "EN" : "繁";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navKeys.map((key, i) => (
            <span key={key} className="flex items-center">
              <Link
                to={navPaths[i]}
                className={`px-3 py-1 text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
                  location.pathname === navPaths[i]
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`nav.${key}`)}
              </Link>
              {i < navKeys.length - 1 && (
                <span className="text-border text-xs">/</span>
              )}
            </span>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 text-xs font-bold tracking-wider text-muted-foreground hover:text-foreground border border-border/40 hover:border-border rounded transition-colors"
          >
            {langLabel}
          </button>
          <CartDrawer />
          <a
            href="https://www.instagram.com/cola_bb_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://www.facebook.com/cokebb225"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border/40">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navKeys.map((key, i) => (
              <Link
                key={key}
                to={navPaths[i]}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-semibold tracking-[0.15em] uppercase transition-colors ${
                  location.pathname === navPaths[i]
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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
