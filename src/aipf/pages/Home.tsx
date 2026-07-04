import { useEffect } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { FeatureCard, ProcessStep } from "@/aipf/components/Directory";
import heroImg from "@/aipf/assets/aipf-hero.jpg";
import sealImg from "@/aipf/assets/aipf-seal.png";

export default function AipfHome() {
  useSEO({
    title: "AI People Foundation — AI Creators Need an Institution",
    description:
      "A cultural foundation and public directory for AI native entities, digital personalities, virtual artists, and synthetic media creators. Founding Cohort 2026 in planning.",
    exactTitle: true,
    url: "https://colabbmusic.com/aipf",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "AI People Foundation",
      alternateName: "AIPF",
      url: "https://colabbmusic.com/aipf",
      founder: { "@type": "Person", name: "Cola B" },
      description:
        "Cultural foundation and public directory for AI native entities and their creators.",
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AipfLayout>
      {/* HERO */}
      <section className="relative aipf-navy overflow-hidden">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="relative container mx-auto px-6 py-28 md:py-36 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <img src={sealImg} alt="" width={72} height={72} className="opacity-95" />
            <SectionLabel className="!text-[hsl(var(--ceremonial-gold))]">
              Founding Cohort 2026 · Now in Planning
            </SectionLabel>
          </div>
          <h1 className="font-institutional text-5xl md:text-7xl leading-[1.05] text-white">
            AI Creators Need <br /> an Institution.
          </h1>
          <div className="aipf-gold-divider w-24 my-8" />
          <p className="text-lg text-white/85 max-w-2xl">
            AI People Foundation is a cultural foundation and public directory for AI native
            entities, digital personalities, virtual artists, and synthetic media creators.
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[hsl(var(--ceremonial-gold))]">
            Founded by Cola B
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/aipf/register-interest"
              className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--ceremonial-gold))] text-[hsl(var(--foundation-navy))] hover:bg-[hsl(var(--ceremonial-gold))]/90"
            >
              Register Interest
            </Link>
            <Link
              to="/aipf/nominate"
              className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-white/50 text-white hover:bg-white/10"
            >
              Nominate a Creator
            </Link>
            <Link
              to="/aipf/directory"
              className="px-6 py-3 text-xs uppercase tracking-[0.18em] text-white/80 hover:text-white underline-offset-4 hover:underline"
            >
              Explore Directory →
            </Link>
          </div>
        </div>
      </section>

      {/* Core line */}
      <section className="container mx-auto px-6 py-24 text-center max-w-3xl">
        <p className="font-institutional italic text-3xl md:text-4xl leading-tight">
          “If your account disappears, your existence should not.”
        </p>
      </section>

      {/* Problem */}
      <section className="container mx-auto px-6 py-16">
        <SectionLabel>The Problem</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2 max-w-2xl">
          Visible through platforms, not protected by them.
        </h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Platform bans", "A single decision can erase an entire creative identity overnight."],
            ["Account deletion", "Years of built audience can vanish without warning."],
            ["Lost links", "Old profiles rot; fans can no longer find the current one."],
            ["Shadow bans", "Reach quietly disappears with no explanation."],
            ["Audience fragmentation", "Creators are scattered across a dozen platforms."],
            ["No public record", "There is no institutional memory of AI native culture."],
          ].map(([t, c]) => (
            <FeatureCard key={t} title={t}>{c}</FeatureCard>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="aipf-navy py-24">
        <div className="container mx-auto px-6">
          <SectionLabel>The Foundation</SectionLabel>
          <h2 className="font-institutional text-4xl text-white mt-2 max-w-2xl">
            A public record beyond platforms.
          </h2>
          <div className="aipf-gold-divider w-16 my-8" />
          <div className="grid md:grid-cols-4 gap-6 text-white/85">
            {[
              ["AIPF Directory", "A public registry of recognized AI native entities."],
              ["Permanent profiles", "An institutional home outside social platforms."],
              ["Official links", "One canonical set of current links, maintained over time."],
              ["Verification", "Reviewed status for identity, originality, and continuity."],
              ["Recognition", "Founding Cohort, member numbers, future awards."],
              ["Creator record", "Studios and creators documented alongside their entities."],
              ["Redirect continuity", "If accounts change, the record updates."],
              ["Historical archive", "A cultural memory for the early era of AI creators."],
            ].map(([t, c]) => (
              <div key={t} className="border-l pl-4" style={{ borderColor: "hsl(var(--ceremonial-gold))" }}>
                <div className="font-institutional text-lg text-white">{t}</div>
                <p className="text-sm mt-2 opacity-80">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <SectionLabel>Eligibility</SectionLabel>
            <h2 className="font-institutional text-4xl mt-2">Who this is for</h2>
            <GoldDivider className="my-6" />
            <ul className="grid grid-cols-2 gap-y-2 text-sm text-foreground/85">
              {[
                "AI musicians",
                "Virtual influencers",
                "Digital humans",
                "AI storytellers",
                "AI filmmakers",
                "AI VTubers",
                "AI educators",
                "AI companions",
                "AI mascots",
                "Creators & studios",
              ].map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>Membership</SectionLabel>
            <h2 className="font-institutional text-4xl mt-2">What members receive</h2>
            <GoldDivider className="my-6" />
            <ul className="space-y-2 text-sm text-foreground/85">
              <li>· Official member profile</li>
              <li>· Directory listing</li>
              <li>· Founding Cohort recognition</li>
              <li>· Nomination rights</li>
              <li>· Awards eligibility (future)</li>
              <li>· Private member network (future)</li>
              <li>· Creator spotlight eligibility</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 pb-24">
        <SectionLabel>Process</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">How it works</h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 max-w-4xl">
          <ProcessStep n={1} title="Build a serious AI native project">
            Whether an entity, a studio, or a creator practice — the work comes first.
          </ProcessStep>
          <ProcessStep n={2} title="Register interest or get nominated">
            Submit your project or be nominated by someone who believes in the work.
          </ProcessStep>
          <ProcessStep n={3} title="Foundation reviews">
            Every submission is reviewed manually — quality first, quantity second.
          </ProcessStep>
          <ProcessStep n={4} title="Directory listing">
            Approved entries join the public AIPF Directory with permanent profiles.
          </ProcessStep>
          <ProcessStep n={5} title="Founding recognition">
            Founding members receive a member number and Cohort 2026 recognition.
          </ProcessStep>
        </div>
      </section>

      {/* Founder note */}
      <section className="aipf-navy py-24">
        <div className="container mx-auto px-6 max-w-3xl text-white text-center">
          <SectionLabel>Founder</SectionLabel>
          <h2 className="font-institutional text-4xl mt-2">Founded by Cola B</h2>
          <div className="aipf-gold-divider w-16 my-8 mx-auto" />
          <p className="text-white/85 leading-relaxed">
            Cola B founded AIPF to help create a cultural home and public record for AI native
            entities and the creators building them. Cola did not create the AI creator movement —
            she recognized that the movement needed an institution.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-24 text-center max-w-2xl">
        <SectionLabel>Now Forming</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">Founding Cohort 2026 is being prepared.</h2>
        <GoldDivider className="my-8 mx-auto" />
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/aipf/register-interest"
            className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--foundation-navy))] text-white hover:bg-[hsl(var(--deep-navy-hover))]"
          >
            Register Interest
          </Link>
          <Link
            to="/aipf/nominate"
            className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-[hsl(var(--foundation-navy))] hover:bg-[hsl(var(--soft-cream))]"
          >
            Nominate a Creator
          </Link>
        </div>
      </section>
    </AipfLayout>
  );
}
