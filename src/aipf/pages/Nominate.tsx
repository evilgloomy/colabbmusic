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
import { useAipfT } from "@/aipf/i18n";

const schema = z.object({
  nominee_entity_name: z.string().min(1).max(200),
  creator_studio_name: z.string().max(200).optional(),
  social_links: z.string().min(1).max(2000),
  category: z.string().min(1),
  country_region: z.string().max(120).optional(),
  why_considered: z.string().min(10).max(2000),
  nominated_by_name: z.string().max(200).optional(),
  nominated_by_email: z.string().email().max(255).optional().or(z.literal("")),
  supporting_links: z.string().max(2000).optional(),
  optional_notes: z.string().max(2000).optional(),
  good_faith: z.literal(true),
});
type V = z.infer<typeof schema>;

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("nom.seoTitle"), description: t("nom.seoDesc"), exactTitle: true });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as any });

  async function onSubmit(v: V) {
    setBusy(true);
    const { error } = await createNomination({ ...v, nominated_by_email: v.nominated_by_email || null });
    setBusy(false);
    if (error) return toast({ title: t("nom.failed"), description: error.message, variant: "destructive" });
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return (
      <section className="container mx-auto px-6 py-24">
        <EmptyState title={t("nom.done.title")} copy={t("nom.done.copy")} />
      </section>
    );
  }

  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>{t("nom.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">{t("nom.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">{t("nom.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-6">
          <F label={t("nom.nominee")} err={errors.nominee_entity_name}><Input {...register("nominee_entity_name")} /></F>
          <F label={t("nom.creator")} err={errors.creator_studio_name}><Input {...register("creator_studio_name")} /></F>
          <F label={t("nom.socials")} err={errors.social_links}><Textarea rows={3} {...register("social_links")} placeholder={t("nom.socialsPh")} /></F>
          <div className="grid md:grid-cols-2 gap-4">
            <F label={t("nom.category")} err={errors.category}>
              <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
                <option value="">{t("common.select")}</option>
                {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label={t("nom.country")} err={errors.country_region}><Input {...register("country_region")} /></F>
          </div>
          <F label={t("nom.why")} err={errors.why_considered}><Textarea rows={4} {...register("why_considered")} /></F>
          <div className="grid md:grid-cols-2 gap-4">
            <F label={t("nom.byName")} err={errors.nominated_by_name}><Input {...register("nominated_by_name")} /></F>
            <F label={t("nom.byEmail")} err={errors.nominated_by_email}><Input type="email" {...register("nominated_by_email")} /></F>
          </div>
          <F label={t("nom.supporting")} err={errors.supporting_links}><Textarea rows={2} {...register("supporting_links")} /></F>
          <F label={t("nom.notes")} err={errors.optional_notes}><Textarea rows={2} {...register("optional_notes")} /></F>

          <label className="flex items-start gap-3 text-sm pt-4 border-t border-border">
            <input type="checkbox" className="mt-1" {...register("good_faith")} />
            <span>
              {t("nom.goodFaith")}
              {errors.good_faith && <span className="block text-xs text-destructive mt-0.5">{t("common.required")}</span>}
            </span>
          </label>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? t("common.submitting") : t("nom.submit")}
          </Button>
        </form>
      </section>
    </>
  );
}

export default function Nominate() {
  return <AipfLayout><Inner /></AipfLayout>;
}

function F({ label, err, children }: { label: string; err?: any; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {err && <p className="text-xs text-destructive mt-1">!</p>}
    </div>
  );
}
