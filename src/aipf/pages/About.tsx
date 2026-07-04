import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { FeatureCard } from "@/aipf/components/Directory";

export default function About() {
  useSEO({
    title: "About — AI People Foundation",
    description:
      "AI People Foundation is a cultural foundation, public directory, and recognition body for AI native entities and their creators.",
    exactTitle: true,
  });

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-20 max-w-4xl">
        <SectionLabel>The Foundation</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">About AI People Foundation</h1>
        <GoldDivider className="my-8" />
        <p className="text-lg text-foreground/85 leading-relaxed">
          AI People Foundation is an invitation-aware cultural organization and public directory dedicated
          to supporting, documenting, recognizing, and connecting AI native entities and their creators.
        </p>
        <p className="mt-6 font-institutional text-2xl italic">
          AIPF represents the cultural layer of AI — not the technology layer.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <SectionLabel>Identity</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">What AIPF Is</h2>
            <GoldDivider className="my-4" />
            <ul className="space-y-2 text-foreground/85 text-sm">
              <li>· A cultural foundation</li>
              <li>· A public directory</li>
              <li>· A recognition system</li>
              <li>· A creator registry</li>
              <li>· A future awards body</li>
              <li>· A historical archive</li>
              <li>· A member network in development</li>
              <li>· A research and education platform in development</li>
            </ul>
          </div>
          <div>
            <SectionLabel>Boundaries</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">What AIPF Is Not</h2>
            <GoldDivider className="my-4" />
            <ul className="space-y-2 text-foreground/85 text-sm">
              <li>· Not an AI software company</li>
              <li>· Not a fan club</li>
              <li>· Not a Discord server</li>
              <li>· Not a management agency</li>
              <li>· Not a crypto project</li>
              <li>· Not a hype group</li>
              <li>· Not owned by a single technology platform</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="aipf-navy py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center text-white">
          <SectionLabel>Thesis</SectionLabel>
          <p className="font-institutional text-3xl md:text-4xl mt-4 leading-tight">
            AIPF does not decide who is famous.<br />AIPF recognizes who is contributing meaningfully to the category.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <SectionLabel>Strategic Objectives</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">Five pillars</h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-5 gap-4">
          {[
            ["Legitimacy", "An institutional voice for a new category."],
            ["Recognition", "Formal acknowledgement of meaningful work."],
            ["Documentation", "A durable, editable public record."],
            ["Connection", "A network of creators, studios, and researchers."],
            ["Authority", "A trusted reference for press, brands, and platforms."],
          ].map(([t, c]) => (
            <FeatureCard key={t} title={t}>{c}</FeatureCard>
          ))}
        </div>
      </section>
    </AipfLayout>
  );
}
