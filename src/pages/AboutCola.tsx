import { Link } from "react-router-dom";
import { Play, Download, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBrand } from "@/hooks/useBrand";
import { PageLayout } from "@/components/layout/PageLayout";
import { useSEO } from "@/hooks/useSEO";

const timelineEN = [
  {
    year: "2023",
    items: [
      { date: "March 2023", title: "Social Media Debut", desc: "Cola B makes her first appearance online, introducing her identity as a digital artist." },
      { date: "May 2023", title: "Music Debut", desc: "Releases her first cover track \"Wonderful U,\" marking her official entry into music." },
      { date: "December 2023", title: "First Original Demo", desc: "Begins transitioning into original songwriting." },
    ],
  },
  {
    year: "2024",
    items: [
      { date: "February 2024", title: "Spotify Editorial Recognition", desc: "Receives first Spotify editorial playlist placement." },
      { date: "April 2024", title: "First Collaboration", desc: "Releases first feature with Yan Ting." },
      { date: "June 2024", title: "Pop Expansion", desc: "Releases English single \"Moonlight\" and pop project POPVIBE." },
      { date: "Summer 2024", title: "Genre Expansion", desc: "Explores EDM and Lo-fi." },
      { date: "October 2024", title: "Viral Growth in China", desc: "Multiple tracks gain traction and airplay across Chinese platforms." },
      { date: "December 2024", title: "Holiday Release", desc: "Releases Merry Christmas project." },
    ],
  },
  {
    year: "2025",
    items: [
      { date: "January 2025", title: "Boundary-Pushing Release", desc: "Releases Censored, expanding artistic tone." },
      { date: "March 2025", title: "Rock Exploration", desc: "Introduces rock influence with Lost." },
      { date: "April 2025", title: "Lovevibe Project Launch", desc: "Begins emotionally driven project series." },
    ],
  },
  {
    year: "2026",
    items: [
      { date: "2026", title: "Ongoing Weekly Releases", desc: "Adopts a high-frequency release model, continuously expanding her catalog and strengthening her global presence." },
    ],
  },
];

const timelineZH = [
  {
    year: "2023",
    items: [
      { date: "2023 年 3 月", title: "社交媒體亮相", desc: "正式以數位藝人身份出道" },
      { date: "2023 年 5 月", title: "音樂出道", desc: "推出首支翻唱作品《Wonderful U》" },
      { date: "2023 年 12 月", title: "首支原創作品", desc: "開始原創音樂創作" },
    ],
  },
  {
    year: "2024",
    items: [
      { date: "2024 年 2 月", title: "Spotify 編輯歌單", desc: "首次進入官方編輯推薦" },
      { date: "2024 年 4 月", title: "首次合作", desc: "與 Yan Ting 推出合作作品" },
      { date: "2024 年 6 月", title: "流行拓展", desc: "推出英文單曲《Moonlight》與專輯《POPVIBE》" },
      { date: "2024 年夏季", title: "風格拓展", desc: "進軍 EDM 與 Lo-fi 領域" },
      { date: "2024 年 10 月", title: "中國市場成長", desc: "多首歌曲於平台獲得廣泛傳播" },
      { date: "2024 年 12 月", title: "節日企劃", desc: "推出聖誕專輯《Merry Christmas》" },
    ],
  },
  {
    year: "2025",
    items: [
      { date: "2025 年 1 月", title: "風格突破", desc: "推出《Censored》拓展創作邊界" },
      { date: "2025 年 3 月", title: "搖滾嘗試", desc: "發行《Lost》探索新風格" },
      { date: "2025 年 4 月", title: "Lovevibe 系列", desc: "啟動情感主題企劃" },
    ],
  },
  {
    year: "2026",
    items: [
      { date: "2026 年", title: "高頻發佈策略", desc: "持續每週推出新作品，擴展音樂版圖" },
    ],
  },
];

const AboutCola = () => {
  const { t, i18n } = useTranslation();
  const brand = useBrand();
  const isZH = i18n.language?.startsWith("zh");
  const timeline = isZH ? timelineZH : timelineEN;

  useSEO({
    title: isZH ? "關於 Cola B — AI 唱作歌手 · 虛擬偶像" : "About Cola B — AI Singer-Songwriter & Virtual Idol",
    description: brand.shortBio,
  });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="container mx-auto px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <p className="text-xs font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 animate-fade-in opacity-0" style={{ animationDelay: "0.1s" }}>
          {t("about.pageTitle")}
        </p>
        <h1 className="text-hero font-display font-bold text-foreground mb-6 animate-fade-in opacity-0" style={{ animationDelay: "0.3s", lineHeight: "1.05" }}>
          COLA B
        </h1>
        <p className="text-display-md font-display italic text-primary mb-8 animate-fade-in opacity-0" style={{ animationDelay: "0.5s" }}>
          {t("about.queenOfEmoPop")}
        </p>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-body animate-fade-in opacity-0" style={{ animationDelay: "0.7s" }}>
          {brand.heroBody}
        </p>
      </section>

      {/* Positioning */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <h2 className="text-display-md font-display font-semibold text-foreground mb-8">{t("about.artistPositioning")}</h2>
          <ul className="space-y-3 max-w-xl">
            {brand.positioning.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-base text-muted-foreground font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Biography */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <h2 className="text-display-md font-display font-semibold text-foreground mb-10">{t("about.biography")}</h2>
          <div className="max-w-2xl space-y-6">
            {brand.longBio.split("\n\n").map((para, i) => (
              <p key={i} className="text-base text-muted-foreground leading-relaxed font-body">{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-border/40" style={{ background: "hsl(20 8% 10%)" }}>
        <div className="container mx-auto px-6 py-20 md:py-28">
          <h2 className="text-display-md font-display font-semibold text-white mb-14">{t("about.timeline")}</h2>
          <div className="space-y-16 max-w-2xl">
            {timeline.map((era) => (
              <div key={era.year}>
                <h3 className="text-lg font-display font-semibold text-white/80 mb-6 border-b border-white/10 pb-3">
                  {t(`about.${era.year}`)}
                </h3>
                <div className="space-y-6">
                  {era.items.map((item, i) => (
                    <div key={i} className="pl-6 border-l border-white/10">
                      <p className="text-xs font-body text-white/70 mb-1">{item.date}</p>
                      <p className="text-sm font-body font-medium text-white mb-1">{item.title}</p>
                      <p className="text-sm font-body text-white/60">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Positioning Summary */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-display-md font-display font-semibold text-foreground mb-6">{t("about.positioningSummary")}</h2>
          <p className="text-base text-muted-foreground font-body mb-4">{t("about.definedBy")}</p>
          <ul className="space-y-2 mb-8">
            {brand.positioning.map((item, i) => (
              <li key={i} className="text-base text-foreground font-body">{item}</li>
            ))}
          </ul>
          <p className="text-base text-muted-foreground font-body italic max-w-lg mx-auto">{t("about.reflectsNewGen")}</p>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link
              to="/music"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-body font-semibold text-sm tracking-wider uppercase transition-opacity hover:opacity-90 active:scale-[0.97]"
            >
              <Play className="h-4 w-4" />
              {t("hero.listenNow")}
            </Link>
            <Link
              to="/press"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-body font-semibold text-sm tracking-wider uppercase hover:border-foreground/40 transition-colors active:scale-[0.97]"
            >
              <Download className="h-4 w-4" />
              {t("about.downloadPressKit")}
            </Link>
            <a
              href="mailto:cola.bb.225@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-foreground/20 text-foreground font-body font-semibold text-sm tracking-wider uppercase hover:border-foreground/40 transition-colors active:scale-[0.97]"
            >
              <Mail className="h-4 w-4" />
              {t("about.contactCollaborations")}
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AboutCola;
