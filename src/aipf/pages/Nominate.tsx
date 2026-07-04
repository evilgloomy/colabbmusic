import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { AIPF_CATEGORIES } from "@/aipf/lib/constants";
import { createNomination } from "@/aipf/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  nominee_entity_name: z.string().min(1, "Required").max(200),
  creator_studio_name: z.string().max(200).optional(),
  social_links: z.string().min(1, "Required").max(2000),
  category: z.string().min(1, "Required"),
  country_region: z.string().max(120).optional(),
  why_considered: z.string().min(10, "Please explain").max(2000),
  nominated_by_name: z.string().max(200).optional(),
  nominated_by_email: z.string().email().max(255).optional().or(z.literal("")),
  supporting_links: z.string().max(2000).optional(),
  optional_notes: z.string().max(2000).optional(),
  good_faith: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});
type V = z.infer<typeof schema>;

export default function Nominate() {
  useSEO({
    title: "Nominate a Creator — AI People Foundation",
    description: "Nominate an AI native entity, creator, or studio for future consideration by AIPF.",
    exactTitle: true,
  });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as any });

  async function onSubmit(v: V) {
    setBusy(true);
    const { error } = await createNomination({
      ...v,
      nominated_by_email: v.nominated_by_email || null,
    });
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return (
      <AipfLayout>
        <section className="container mx-auto px-6 py-24">
          <EmptyState title="Nomination submitted" copy="The Foundation team will review nominations for future invitations." />
        </section>
      </AipfLayout>
    );
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>Nomination</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">Nominate a Creator</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">
          AIPF grows through discovery, nomination, and review. Use this form to nominate an AI
          native entity, creator, or studio for future consideration.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-6">
          <F label="Nominee entity name *" err={errors.nominee_entity_name}><Input {...register("nominee_entity_name")} /></F>
          <F label="Creator / studio name" err={errors.creator_studio_name}><Input {...register("creator_studio_name")} /></F>
          <F label="Nominee social links *" err={errors.social_links}><Textarea rows={3} {...register("social_links")} placeholder="One per line" /></F>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="Category *" err={errors.category}>
              <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
                <option value="">Select…</option>
                {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Country / region" err={errors.country_region}><Input {...register("country_region")} /></F>
          </div>
          <F label="Why should they be considered? *" err={errors.why_considered}><Textarea rows={4} {...register("why_considered")} /></F>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="Nominated by (name)" err={errors.nominated_by_name}><Input {...register("nominated_by_name")} /></F>
            <F label="Nominated by (email)" err={errors.nominated_by_email}><Input type="email" {...register("nominated_by_email")} /></F>
          </div>
          <F label="Supporting links" err={errors.supporting_links}><Textarea rows={2} {...register("supporting_links")} /></F>
          <F label="Optional notes" err={errors.optional_notes}><Textarea rows={2} {...register("optional_notes")} /></F>

          <label className="flex items-start gap-3 text-sm pt-4 border-t border-border">
            <input type="checkbox" className="mt-1" {...register("good_faith")} />
            <span>
              I am submitting this nomination in good faith.
              {errors.good_faith && <span className="block text-xs text-destructive mt-0.5">{errors.good_faith.message as string}</span>}
            </span>
          </label>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Submitting…" : "Submit Nomination"}
          </Button>
        </form>
      </section>
    </AipfLayout>
  );
}

function F({ label, err, children }: { label: string; err?: any; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {err && <p className="text-xs text-destructive mt-1">{err.message as string}</p>}
    </div>
  );
}
