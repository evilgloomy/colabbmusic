import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { FeatureCard, ProcessStep } from "@/aipf/components/Directory";
import { useAipfT } from "@/aipf/i18n";
import heroImg from "@/aipf/assets/aipf-hero.jpg";
import sealImg from "@/aipf/assets/aipf-seal.png";

function HomeInner() {
  const { t } = useAipfT();
  useSEO({
    title: t("home.seoTitle"),
    description: t("home.seoDesc"),
    exactTitle: true,
    url: "https://colabbmusic.com/aipf",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AI People Foundation",
      alternateName: "AIPF",
      url: "https://colabbmusic.com/aipf",
      founder: { "@type": "Person", name: "Cola B" },
      description: t("home.seoDesc"),
    },
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const problems: [string, string][] = [
    [t("home.problem.bans.t"), t("home.problem.bans.c")],
    [t("home.problem.deletion.t"), t("home.problem.deletion.c")],
    [t("home.problem.lost.t"), t("home.problem.lost.c")],
    [t("home.problem.shadow.t"), t("home.problem.shadow.c")],
    [t("home.problem.frag.t"), t("home.problem.frag.c")],
    [t("home.problem.record.t"), t("home.problem.record.c")],
  ];
  const solutions: [string, string][] = [
    [t("home.solution.dir.t"), t("home.solution.dir.c")],
    [t("home.solution.perm.t"), t("home.solution.perm.c")],
    [t("home.solution.official.t"), t("home.solution.official.c")],
    [t("home.solution.verify.t"), t("home.solution.verify.c")],
    [t("home.solution.recog.t"), t("home.solution.recog.c")],
    [t("home.solution.record.t"), t("home.solution.record.c")],
    [t("home.solution.redirect.t"), t("home.solution.redirect.c")],
    [t("home.solution.archive.t"), t("home.solution.archive.c")],
  ];
  const audience = [
    t("home.who.musicians"), t("home.who.influencers"), t("home.who.humans"),
    t("home.who.storytellers"), t("home.who.filmmakers"), t("home.who.vtubers"),
    t("home.who.educators"), t("home.who.companions"), t("home.who.mascots"),
    t("home.who.creators"),
  ];
  const benefits = [
    t("home.mem.profile"), t("home.mem.listing"), t("home.mem.cohort"),
    t("home.mem.nominate"), t("home.mem.awards"), t("home.mem.network"),
    t("home.mem.spotlight"),
  ];

  return (
    <>
      <section className="relative aipf-navy overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="relative container mx-auto px-6 py-28 md:py-36 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <img src={sealImg} alt="" width={72} height={72} className="opacity-95" />
            <SectionLabel className="!text-[hsl(var(--ceremonial-gold))]">{t("home.hero.label")}</SectionLabel>
          </div>
          <h1 className="font-institutional text-5xl md:text-7xl leading-[1.05] text-white">
            {t("home.hero.title1")} <br /> {t("home.hero.title2")}
          </h1>
          <div className="aipf-gold-divider w-24 my-8" />
          <p className="text-lg text-white/85 max-w-2xl">{t("home.hero.desc")}</p>
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[hsl(var(--ceremonial-gold))]">{t("home.hero.foundedBy")}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/aipf/join" className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--ceremonial-gold))] text-[hsl(var(--foundation-navy))] hover:bg-[hsl(var(--ceremonial-gold))]/90">
              {t("nav.join")}
            </Link>
            <Link to="/aipf/directory" className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-white/50 text-white hover:bg-white/10">
              {t("home.hero.explore")}
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24 text-center max-w-3xl">
        <p className="font-institutional italic text-3xl md:text-4xl leading-tight">{t("home.quote")}</p>
      </section>

      <section className="container mx-auto px-6 py-16">
        <SectionLabel>{t("home.problem.label")}</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2 max-w-2xl">{t("home.problem.title")}</h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map(([title, c]) => (
            <FeatureCard key={title} title={title}>{c}</FeatureCard>
          ))}
        </div>
      </section>

      <section className="aipf-navy py-24">
        <div className="container mx-auto px-6">
          <SectionLabel>{t("home.solution.label")}</SectionLabel>
          <h2 className="font-institutional text-4xl text-white mt-2 max-w-2xl">{t("home.solution.title")}</h2>
          <div className="aipf-gold-divider w-16 my-8" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-10 text-white/85">
            {solutions.slice(0, 6).map(([title, c]) => (
              <div key={title} className="border-l pl-4" style={{ borderColor: "hsl(var(--ceremonial-gold))" }}>
                <div className="font-institutional text-xl text-white">{title}</div>
                <p className="text-sm mt-2 opacity-80">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <SectionLabel>{t("home.who.eligibility")}</SectionLabel>
            <h2 className="font-institutional text-4xl mt-2">{t("home.who.title")}</h2>
            <GoldDivider className="my-6" />
            <div className="flex flex-wrap gap-2">
              {audience.map((x) => (
                <span
                  key={x}
                  className="px-3 py-1.5 text-xs uppercase tracking-[0.1em] border"
                  style={{ borderColor: "hsl(var(--ceremonial-gold) / 0.55)", color: "hsl(var(--foundation-navy))" }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>{t("home.mem.label")}</SectionLabel>
            <h2 className="font-institutional text-4xl mt-2">{t("home.mem.title")}</h2>
            <GoldDivider className="my-6" />
            <ul className="space-y-2.5 text-sm text-foreground/85">
              {benefits.map((b) => (
                <li key={b} className="flex gap-2.5">
                  <span style={{ color: "hsl(var(--ceremonial-gold))" }}>✦</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <SectionLabel>{t("home.how.label")}</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">{t("home.how.title")}</h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 max-w-4xl">
          <ProcessStep n={1} title={t("home.how.s1.t")}>{t("home.how.s1.c")}</ProcessStep>
          <ProcessStep n={2} title={t("home.how.s2.t")}>{t("home.how.s2.c")}</ProcessStep>
          <ProcessStep n={3} title={t("home.how.s3.t")}>{t("home.how.s3.c")}</ProcessStep>
          <ProcessStep n={4} title={t("home.how.s4.t")}>{t("home.how.s4.c")}</ProcessStep>
          <ProcessStep n={5} title={t("home.how.s5.t")}>{t("home.how.s5.c")}</ProcessStep>
        </div>
      </section>

      <section className="aipf-navy py-24">
        <div className="container mx-auto px-6 max-w-3xl text-white text-center">
          <SectionLabel>{t("home.founder.label")}</SectionLabel>
          <h2 className="font-institutional text-4xl mt-2">{t("home.founder.title")}</h2>
          <div className="aipf-gold-divider w-16 my-8 mx-auto" />
          <p className="text-white/85 leading-relaxed">{t("home.founder.body")}</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24 text-center max-w-2xl">
        <SectionLabel>{t("home.cta.label")}</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">{t("home.cta.title")}</h2>
        <GoldDivider className="my-8 mx-auto" />
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/aipf/join" className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--foundation-navy))] text-white hover:bg-[hsl(var(--deep-navy-hover))]">
            {t("nav.join")}
          </Link>
          <Link to="/aipf/nominate" className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-[hsl(var(--foundation-navy))] hover:bg-[hsl(var(--soft-cream))]">
            {t("nav.nominate")}
          </Link>
        </div>
      </section>
    </>
  );
}

export default function AipfHome() {
  return <AipfLayout><HomeInner /></AipfLayout>;
}
