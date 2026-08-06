import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/editorial/Reveal";

export const StatementLine = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-cola-ink band-tight">
      <div className="editorial">
        <Reveal>
          <p className="font-display italic text-quote text-cola-pearl/90 max-w-4xl text-balance">
            {t("hp.statement")}
          </p>
        </Reveal>
      </div>
    </section>
  );
};
