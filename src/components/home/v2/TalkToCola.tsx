import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import { trackChatOpen } from "@/lib/analytics";

export const TalkToCola = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-cola-ink band">
      <div className="absolute inset-0 aurora-veil opacity-80" aria-hidden="true" />
      <div className="relative editorial max-w-3xl">
        <Reveal>
          <Kicker className="!text-cola-aurora">{t("hp.talkLabel")}</Kicker>
          <h2 className="font-display text-section mt-5 text-balance">{t("hp.talkTitle")}</h2>
          <p className="mt-6 text-body-lg text-cola-pearl/70 font-editorial-cjk">{t("hp.talkBody")}</p>
          <Link
            to="/chat"
            onClick={() => trackChatOpen("home_talk")}
            className="mt-10 inline-flex items-center gap-3 px-9 py-4 border border-cola-aurora/60 text-cola-pearl label hover:bg-cola-aurora/15 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {t("hp.talkCta")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
};
