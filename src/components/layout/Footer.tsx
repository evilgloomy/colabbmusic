import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { useTranslation } from "react-i18next";
import shibaLogo from "@/assets/shiba-inu-logo.png";

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="container mx-auto px-6 py-12">
        {/* Studio line */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <img src={shibaLogo} alt={t("footer.studioLogoAlt")} className="h-12 w-12 object-contain" />
            <div>
              <p className="font-body text-sm font-bold tracking-[0.1em] uppercase text-foreground">
                Shiba Inu Media
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs font-body">
                {t("footer.studioDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/cola_bb_official/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.facebook.com/cokebb225" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground font-body mb-6">
          <Link to="/about-cola" className="hover:text-foreground transition-colors">{t("footer.aboutColaB")}</Link>
          <Link to="/press" className="hover:text-foreground transition-colors">{t("footer.pressKit")}</Link>
          <a href="mailto:cola.bb.225@gmail.com" className="hover:text-foreground transition-colors">{t("footer.contact")}</a>
          <Link to="/policies" className="hover:text-foreground transition-colors">{t("footer.shippingReturns")}</Link>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground/60 font-body">
            © {new Date().getFullYear()} Cola B. {t("footer.allRightsReserved")}
          </p>
          <div className="flex gap-4 text-[11px] text-muted-foreground/60 font-body">
            <Link to="/privacy" className="hover:text-muted-foreground transition-colors">{t("footer.privacyPolicy")}</Link>
            <Link to="/terms" className="hover:text-muted-foreground transition-colors">{t("footer.termsOfService")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
