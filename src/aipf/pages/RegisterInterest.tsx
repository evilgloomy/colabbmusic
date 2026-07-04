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

const schema = z.object({
  entity_name: z.string().min(1, "Required").max(200),
  creator_studio_name: z.string().min(1, "Required").max(200),
  contact_name: z.string().min(1, "Required").max(200),
  contact_email: z.string().email().max(255),
  country_region: z.string().min(1, "Required").max(120),
  category: z.string().min(1, "Required"),
  year_launched: z.string().optional(),
  main_platform_link: z.string().url("Must be a valid URL").max(500),
  additional_links: z.string().max(2000).optional(),
  follower_count: z.string().max(50).optional(),
  short_bio: z.string().min(10, "Please provide a short bio").max(1000),
  why_include: z.string().min(10, "Please explain").max(2000),
  ai_native_explanation: z.string().min(10, "Please explain").max(2000),
  official_image_url: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  authorized: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  understands_no_guarantee: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  newsletter_opt_in: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterInterest() {
  useSEO({
    title: "Register Interest — AI People Foundation",
    description: "Submit an AI native project for consideration by the AI People Foundation.",
    exactTitle: true,
  });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register, handleSubmit, formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as any });

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
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return (
      <AipfLayout>
        <section className="container mx-auto px-6 py-24">
          <EmptyState
            title="Thank you for registering interest"
            copy="Your project has been received for review. AIPF is currently preparing Founding Cohort 2026. Follow Cola B and AIPF for updates."
          />
        </section>
      </AipfLayout>
    );
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>Consideration Form</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">Register Interest</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">
          AIPF is currently preparing Founding Cohort 2026. Membership and directory inclusion are
          reviewed manually. Submitting this form does not guarantee acceptance, but helps the
          Foundation discover and document serious AI native projects.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-6">
          <TwoCol>
            <Field label="Entity name *" err={errors.entity_name}><Input {...register("entity_name")} /></Field>
            <Field label="Creator / studio name *" err={errors.creator_studio_name}><Input {...register("creator_studio_name")} /></Field>
            <Field label="Contact name *" err={errors.contact_name}><Input {...register("contact_name")} /></Field>
            <Field label="Contact email *" err={errors.contact_email}><Input type="email" {...register("contact_email")} /></Field>
            <Field label="Country / region *" err={errors.country_region}><Input {...register("country_region")} /></Field>
            <Field label="Category *" err={errors.category}>
              <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
                <option value="">Select…</option>
                {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Year launched" err={errors.year_launched}><Input type="number" {...register("year_launched")} /></Field>
            <Field label="Follower count" err={errors.follower_count}><Input {...register("follower_count")} /></Field>
          </TwoCol>
          <Field label="Main platform link *" err={errors.main_platform_link}><Input {...register("main_platform_link")} placeholder="https://" /></Field>
          <Field label="Additional links" err={errors.additional_links}><Textarea rows={3} {...register("additional_links")} placeholder="One URL per line" /></Field>
          <Field label="Short bio *" err={errors.short_bio}><Textarea rows={3} {...register("short_bio")} /></Field>
          <Field label="Why should this project be included in AIPF? *" err={errors.why_include}><Textarea rows={4} {...register("why_include")} /></Field>
          <Field label="What makes the project AI native? *" err={errors.ai_native_explanation}><Textarea rows={3} {...register("ai_native_explanation")} /></Field>
          <TwoCol>
            <Field label="Official image URL" err={errors.official_image_url}><Input {...register("official_image_url")} placeholder="https://" /></Field>
            <Field label="Logo URL" err={errors.logo_url}><Input {...register("logo_url")} placeholder="https://" /></Field>
          </TwoCol>

          <div className="space-y-3 pt-4 border-t border-border">
            <Check label="I confirm that I am authorized to submit this project for consideration." err={errors.authorized}><input type="checkbox" {...register("authorized")} /></Check>
            <Check label="I understand that submission does not guarantee membership or public listing." err={errors.understands_no_guarantee}><input type="checkbox" {...register("understands_no_guarantee")} /></Check>
            <Check label="I would like to receive AIPF updates."><input type="checkbox" {...register("newsletter_opt_in")} /></Check>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit for Consideration"}
          </Button>
        </form>
      </section>
    </AipfLayout>
  );
}

function Field({ label, err, children }: { label: string; err?: any; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {err && <p className="text-xs text-destructive mt-1">{err.message}</p>}
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
        {err && <span className="block text-xs text-destructive mt-0.5">{err.message}</span>}
      </span>
    </label>
  );
}
