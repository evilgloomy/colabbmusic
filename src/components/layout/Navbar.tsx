import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { CartDrawer } from "@/components/store/CartDrawer";
import { useTranslation } from "react-i18next";
import { SocialIcon } from "@/lib/socialIcons";
import { socialLinks } from "@/data/content";
import { trackSocialClick } from "@/lib/analytics";

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="font-display text-xl font-bold text-foreground tracking-tight mr-8">
          Cola B
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {navKeys.map((key, i) => (
            <span key={key} className="flex items-center">
              <Link
                to={navPaths[i]}
                className={`px-3 py-1 text-xs font-body font-semibold tracking-[0.12em] uppercase transition-colors ${
                  location.pathname === navPaths[i]
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`nav.${key}`)}
              </Link>
              {i < navKeys.length - 1 && (
                <span className="text-border text-xs select-none">/</span>
              )}
            </span>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={toggleLang}
            className="px-2.5 py-1 text-xs font-body font-bold tracking-wider text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-colors"
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
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
          >
            <SocialIcon platform="instagram" className="h-4 w-4" />
          </a>
          <a
            href={socialLinks.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
            onClick={() => trackSocialClick("spotify", "navbar")}
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
          >
            <SocialIcon platform="spotify" className="h-4 w-4" />
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
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/30">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navKeys.map((key, i) => (
              <Link
                key={key}
                to={navPaths[i]}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-body font-semibold tracking-[0.12em] uppercase transition-colors ${
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
