import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getConsent, setConsent, initAnalytics } from "@/lib/analytics";

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  const accept = () => {
    setConsent("accepted");
    initAnalytics();
    setVisible(false);
  };

  const reject = () => {
    setConsent("rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("consent.title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <p className="flex-1 text-xs md:text-sm text-foreground/80 font-body leading-relaxed">
          {t("consent.message")}{" "}
          <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
            {t("consent.learnMore")}
          </Link>
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={reject}
            className="px-5 py-2.5 text-xs font-body font-semibold tracking-wider uppercase border border-foreground/20 hover:border-foreground/40 transition-colors"
          >
            {t("consent.reject")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-5 py-2.5 text-xs font-body font-semibold tracking-wider uppercase bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
};
