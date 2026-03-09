import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CartDrawer } from "@/components/CartDrawer";
import { Menu, X, Instagram } from "lucide-react";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Music", path: "/music" },
  { label: "Story", path: "/story" },
  { label: "Videos", path: "/videos" },
  { label: "Press", path: "/press" },
];

const SHOPIFY_STORE_URL = "https://909d73.myshopify.com";

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Cola B
        </Link>

        {/* Desktop nav with slash separators */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item, i) => (
            <span key={item.path} className="flex items-center">
              <Link
                to={item.path}
                className={`px-3 py-1 text-xs font-medium tracking-widest uppercase transition-colors ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
              {i < navItems.length - 1 && (
                <span className="text-border text-xs">/</span>
              )}
            </span>
          ))}
        </div>

        {/* Right side: social + cart + mobile toggle */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <CartDrawer />
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
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium tracking-widest uppercase transition-colors ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};