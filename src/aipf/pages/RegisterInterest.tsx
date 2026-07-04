import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { AIPF_CATEGORIES } from "@/aipf/lib/constants";
import { createInterestSubmission } from "@/aipf/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAipfT } from "@/aipf/i18n";

const schema = z.object({
  entity_name: z.string().min(1).max(200),
  creator_studio_name: z.string().min(1).max(200),
  contact_name: z.string().min(1).max(200),
  contact_email: z.string().email().max(255),
  country_region: z.string().min(1).max(120),
  category: z.string().min(1),
  year_launched: z.string().optional(),
  main_platform_link: z.string().url().max(500),
  additional_links: z.string().max(2000).optional(),
  follower_count: z.string().max(50).optional(),
  short_bio: z.string().min(10).max(1000),
  why_include: z.string().min(10).max(2000),
  ai_native_explanation: z.string().min(10).max(2000),
  official_image_url: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  authorized: z.literal(true),
  understands_no_guarantee: z.literal(true),
  newsletter_opt_in: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("reg.seoTitle"), description: t("reg.seoDesc"), exactTitle: true });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) as any });

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    const payload = {
      ...v,
      year_launched: v.year_launched ? parseInt(v.year_launched, 10) : null,
      official_image_url: v.official_image_url || null,
      logo_url: v.logo_url || null,
    };
    const { error } = await createInterestSubmission(payload);
    setSubmitting(false);
    if (error) {
      toast({ title: t("reg.failed"), description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return (
      <section className="container mx-auto px-6 py-24">
        <EmptyState title={t("reg.done.title")} copy={t("reg.done.copy")} />
      </section>
    );
  }

  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>{t("reg.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">{t("reg.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">{t("reg.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-6">
          <TwoCol>
            <Field label={t("reg.entityName")} err={errors.entity_name}><Input {...register("entity_name")} /></Field>
            <Field label={t("reg.creator")} err={errors.creator_studio_name}><Input {...register("creator_studio_name")} /></Field>
            <Field label={t("reg.contactName")} err={errors.contact_name}><Input {...register("contact_name")} /></Field>
            <Field label={t("reg.contactEmail")} err={errors.contact_email}><Input type="email" {...register("contact_email")} /></Field>
            <Field label={t("reg.country")} err={errors.country_region}><Input {...register("country_region")} /></Field>
            <Field label={t("reg.category")} err={errors.category}>
              <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
                <option value="">{t("common.select")}</option>
                {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={t("reg.year")} err={errors.year_launched}><Input type="number" {...register("year_launched")} /></Field>
            <Field label={t("reg.followers")} err={errors.follower_count}><Input {...register("follower_count")} /></Field>
          </TwoCol>
          <Field label={t("reg.mainLink")} err={errors.main_platform_link}><Input {...register("main_platform_link")} placeholder="https://" /></Field>
          <Field label={t("reg.addLinks")} err={errors.additional_links}><Textarea rows={3} {...register("additional_links")} placeholder={t("reg.addLinksPh")} /></Field>
          <Field label={t("reg.bio")} err={errors.short_bio}><Textarea rows={3} {...register("short_bio")} /></Field>
          <Field label={t("reg.why")} err={errors.why_include}><Textarea rows={4} {...register("why_include")} /></Field>
          <Field label={t("reg.aiNative")} err={errors.ai_native_explanation}><Textarea rows={3} {...register("ai_native_explanation")} /></Field>
          <TwoCol>
            <Field label={t("reg.imageUrl")} err={errors.official_image_url}><Input {...register("official_image_url")} placeholder="https://" /></Field>
            <Field label={t("reg.logoUrl")} err={errors.logo_url}><Input {...register("logo_url")} placeholder="https://" /></Field>
          </TwoCol>

          <div className="space-y-3 pt-4 border-t border-border">
            <Check label={t("reg.check.authorized")} err={errors.authorized}><input type="checkbox" {...register("authorized")} /></Check>
            <Check label={t("reg.check.noGuarantee")} err={errors.understands_no_guarantee}><input type="checkbox" {...register("understands_no_guarantee")} /></Check>
            <Check label={t("reg.check.newsletter")}><input type="checkbox" {...register("newsletter_opt_in")} /></Check>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("common.submitting") : t("reg.submit")}
          </Button>
        </form>
      </section>
    </>
  );
}

export default function RegisterInterest() {
  return <AipfLayout><Inner /></AipfLayout>;
}

function Field({ label, err, children }: { label: string; err?: any; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {err && <p className="text-xs text-destructive mt-1">{err.message || "!"}</p>}
    </div>
  );
}
function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}
function Check({ label, err, children }: { label: string; err?: any; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <span className="mt-1">{children}</span>
      <span>
        {label}
        {err && <span className="block text-xs text-destructive mt-0.5">!</span>}
      </span>
    </label>
  );
}
