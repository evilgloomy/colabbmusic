import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";

export default function FoundingCohort() {
  useSEO({
    title: "Founding Cohort 2026 — AI People Foundation",
    description: "The first class of AIPF members: invitation only, nomination based, quality first.",
    exactTitle: true,
  });
  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>MMXXVI</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">Founding Cohort 2026</h1>
        <GoldDivider className="my-6" />
        <p className="text-lg text-foreground/85 leading-relaxed">
          The Founding Cohort will be the first class of invited members recognized by AIPF. This
          group will help establish the Foundation's early identity, culture, and standards.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          <div className="aipf-frame p-6">
            <SectionLabel>Composition</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm">
              <li>· Target size: <strong>20 to 50 members</strong></li>
              <li>· Invitation only</li>
              <li>· Nomination based</li>
              <li>· Quality first</li>
              <li>· Public recognition</li>
              <li>· Permanent directory record</li>
            </ul>
          </div>
          <div className="aipf-frame p-6">
            <SectionLabel>Selection Logic</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm">
              <li>· Recognized AI native projects</li>
              <li>· Strong public identity</li>
              <li>· Meaningful audience</li>
              <li>· Cultural or technical originality</li>
              <li>· Consistent creative output</li>
              <li>· Geographic and category diversity</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 max-w-3xl text-center">
        <div className="aipf-frame p-10">
          <SectionLabel>Current Status</SectionLabel>
          <h2 className="font-institutional text-3xl mt-3">Founding Cohort 2026 is currently being prepared.</h2>
          <GoldDivider className="my-6 mx-auto" />
          <p className="text-foreground/80">Members will be displayed after review and confirmation.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/aipf/register-interest" className="px-5 py-2 text-xs uppercase tracking-[0.16em] bg-[hsl(var(--foundation-navy))] text-white">Register Interest</Link>
            <Link to="/aipf/nominate" className="px-5 py-2 text-xs uppercase tracking-[0.16em] border">Nominate a Creator</Link>
          </div>
        </div>
      </section>
    </AipfLayout>
  );
}
