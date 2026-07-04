import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";

const phases = [
  {
    label: "Now",
    items: [
      ["AI People Directory", "The first public product of the Foundation."],
      ["Member Profiles", "Permanent institutional pages for approved entities."],
      ["Registration", "Public consideration form for AI native projects."],
      ["Nomination", "Community driven discovery of new entities."],
      ["Creator Spotlights", "Editorial coverage of selected members."],
    ],
  },
  {
    label: "Next",
    items: [
      ["Annual Industry Report", "State of AI native culture, published yearly."],
      ["AI People Awards", "Formal recognition across categories."],
      ["Digital Hall of Fame", "Permanent honors for landmark entities."],
      ["Member Roundtables", "Private convenings for accepted members."],
      ["Research & Education", "Foundational writing on AI native identity."],
    ],
  },
  {
    label: "Later",
    items: [
      ["Grants & Fellowships", "Direct support for emerging AI native creators."],
      ["Global Chapters", "Regional Foundation presence and events."],
    ],
  },
];

export default function Programs() {
  useSEO({ title: "Programs — AI People Foundation", exactTitle: true });
  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>Roadmap</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">Programs</h1>
        <GoldDivider className="my-6" />
      </section>

      {phases.map((phase) => (
        <section key={phase.label} className="container mx-auto px-6 pb-16">
          <div className="flex items-baseline gap-4">
            <span
              className="px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em]"
              style={{ background: "hsl(var(--foundation-navy))", color: "hsl(var(--institution-white))" }}
            >
              {phase.label}
            </span>
            <h2 className="font-institutional text-2xl text-muted-foreground">
              {phase.label === "Now" ? "Active programs" : phase.label === "Next" ? "In planning" : "Future ambition"}
            </h2>
          </div>
          <GoldDivider className="my-6" />
          <div className="grid md:grid-cols-3 gap-6">
            {phase.items.map(([t, c]) => (
              <div key={t} className="aipf-frame p-6">
                <div className="aipf-label">{phase.label}</div>
                <h3 className="font-institutional text-xl mt-2">{t}</h3>
                <p className="text-sm text-foreground/80 mt-2">{c}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AipfLayout>
  );
}
