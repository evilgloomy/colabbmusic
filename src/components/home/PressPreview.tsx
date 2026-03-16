import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBrand } from "@/hooks/useBrand";

export const PressPreview = () => {
  const { t } = useTranslation();
  const brand = useBrand();

  return (
    <section className="border-t border-border/40">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6">
            {t("home.aboutTheArtist")}
          </p>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-display italic mb-8">
            "{brand.mediumBio}"
          </p>
          <Link
            to="/press"
            className="inline-block px-8 py-3 border border-foreground/20 text-foreground text-xs font-medium tracking-widest uppercase hover:border-foreground/50 transition-colors"
          >
            {t("home.viewPressKit")}
          </Link>
        </div>
      </div>
    </section>
  );
};
