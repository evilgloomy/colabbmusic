import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import shibaLogo from "@/assets/shiba-inu-logo.png";
import { EmailSignup } from "@/components/marketing/EmailSignup";
import { SocialIcon, type SocialPlatform } from "@/lib/socialIcons";
import { socialLinks } from "@/data/content";
import { trackSocialClick } from "@/lib/analytics";

const FOOTER_SOCIALS: SocialPlatform[] = [
  "spotify",
  "appleMusic",
  "youtube",
  "instagram",
  "tiktok",
  "facebook",
  "threads",
  "soundcloud",
];

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="container mx-auto px-6 py-12">
        {/* Newsletter */}
        <div className="pb-10 mb-10 border-b border-border/30">
          <EmailSignup
            source="footer"
            variant="inline"
            headline={t("newsletter.headline")}
            subhead={t("newsletter.subhead")}
          />
        </div>

        {/* Studio line */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
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

          <div className="flex flex-wrap items-center gap-3">
            {FOOTER_SOCIALS.map((p) => {
              const href = socialLinks[p];
              if (!href) return null;
              return (
                <a
                  key={p}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={p}
                  onClick={() => trackSocialClick(p, "footer")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SocialIcon platform={p} className="h-4 w-4" />
                </a>
              );
            })}
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
