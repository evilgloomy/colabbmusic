import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider, SealLogo } from "@/aipf/components/Chrome";
import { PortraitGuidelines } from "@/aipf/components/PortraitGuidelines";
import { AIPF_CATEGORIES } from "@/aipf/lib/constants";
import { linksToText } from "@/aipf/lib/utils";
import { createInterestSubmission } from "@/aipf/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAipfT } from "@/aipf/i18n";

type Step = 0 | 1 | 2 | 3;

const EMPTY_LINK = { platform: "", url: "" };

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("apply.seoTitle"), description: t("apply.seoDesc"), exactTitle: true });

  const [step, setStep] = useState<Step>(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const [f, setF] = useState({
    entity_name: "",
    creator_studio_name: "",
    category: "",
    country_region: "",
    year_launched: "",
    main_platform_link: "",
    follower_count: "",
    short_bio: "",
    why_include: "",
    ai_native_explanation: "",
    official_image_url: "",
    logo_url: "",
    contact_name: "",
    contact_email: "",
    authorized: false,
    understands_no_guarantee: false,
    newsletter_opt_in: false,
  });
  const [links, setLinks] = useState([{ ...EMPTY_LINK }]);

  useEffect(() => { window.scrollTo(0, 0); }, [step, done]);

  const set = (k: keyof typeof f) => (v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const stepValid: Record<Step, boolean> = {
    0: !!(f.entity_name.trim() && f.creator_studio_name.trim() && f.category && f.country_region.trim()),
    1: /^https?:\/\/.+/.test(f.main_platform_link.trim()),
    2: f.short_bio.trim().length >= 10 && f.why_include.trim().length >= 10,
    3: !!(f.contact_name.trim() && /.+@.+\..+/.test(f.contact_email) && f.authorized && f.understands_no_guarantee),
  };

  function next() {
    if (!stepValid[step]) { setTried(true); return; }
    setTried(false);
    setStep((s) => (s + 1) as Step);
  }

  async function submit() {
    if (!stepValid[3]) { setTried(true); return; }
    setBusy(true);
    const { error } = await createInterestSubmission({
      entity_name: f.entity_name.trim(),
      creator_studio_name: f.creator_studio_name.trim(),
      contact_name: f.contact_name.trim(),
      contact_email: f.contact_email.trim(),
      country_region: f.country_region.trim(),
      category: f.category,
      year_launched: /^\d{4}$/.test(f.year_launched) ? parseInt(f.year_launched, 10) : null,
      main_platform_link: f.main_platform_link.trim(),
      additional_links: linksToText(links) || null,
      follower_count: f.follower_count.trim() || null,
      short_bio: f.short_bio.trim(),
      why_include: f.why_include.trim(),
      ai_native_explanation: f.ai_native_explanation.trim() || null,
      official_image_url: f.official_image_url.trim() || null,
      logo_url: f.logo_url.trim() || null,
      authorized: true,
      understands_no_guarantee: true,
      newsletter_opt_in: f.newsletter_opt_in,
    });
    setBusy(false);
    if (error) {
      toast({ title: t("reg.failed"), description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="container mx-auto px-6 py-24 max-w-2xl text-center">
        <div className="aipf-frame p-10 md:p-14">
          <SealLogo size={64} className="mx-auto" />
          <h1 className="font-institutional text-4xl mt-6">{t("apply.done.title")}</h1>
          <GoldDivider className="my-6 mx-auto" />
          <p className="text-foreground/80">{t("apply.done.copy")}</p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link to="/aipf/directory" className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--foundation-navy))] text-white">
              {t("nav.directory")}
            </Link>
            <Link to="/aipf" className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-[hsl(var(--foundation-navy))]">
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const stepTitles = [t("apply.st1"), t("apply.st2"), t("apply.st3"), t("apply.st4")];

  return (
    <>
      <section className="container mx-auto px-6 py-14 max-w-3xl">
        <SectionLabel>{t("apply.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">{t("apply.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-sm text-foreground/75">{t("apply.intro")}</p>

        <div className="mt-8 grid grid-cols-4 gap-1">
          {stepTitles.map((s, i) => (
            <div key={s}>
              <div
                className="h-1"
                style={{ background: i <= step ? "hsl(var(--ceremonial-gold))" : "hsl(var(--border))" }}
              />
              <div className={`mt-2 text-[0.6rem] uppercase tracking-[0.14em] ${i === step ? "text-[hsl(var(--foundation-navy))] font-semibold" : "text-muted-foreground"}`}>
                {String(i + 1).padStart(2, "0")} {s}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        <div className="aipf-frame p-8 space-y-6">
          {step === 0 && (
            <>
              <StepIntro title={t("apply.st1")} copy={t("apply.s1.intro")} />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label={t("reg.entityName")} required err={tried && !f.entity_name.trim()}>
                  <Input value={f.entity_name} onChange={(e) => set("entity_name")(e.target.value)} />
                </Field>
                <Field label={t("reg.creator")} required err={tried && !f.creator_studio_name.trim()}>
                  <Input value={f.creator_studio_name} onChange={(e) => set("creator_studio_name")(e.target.value)} />
                </Field>
                <Field label={t("reg.category")} required err={tried && !f.category}>
                  <select
                    value={f.category}
                    onChange={(e) => set("category")(e.target.value)}
                    className="h-10 w-full px-3 border border-input bg-background text-sm"
                  >
                    <option value="">{t("common.select")}</option>
                    {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t("reg.country")} required err={tried && !f.country_region.trim()}>
                  <Input value={f.country_region} onChange={(e) => set("country_region")(e.target.value)} />
                </Field>
                <Field label={t("reg.year")}>
                  <Input type="number" value={f.year_launched} onChange={(e) => set("year_launched")(e.target.value)} placeholder="2024" />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepIntro title={t("apply.st2")} copy={t("apply.s2.intro")} />
              <Field label={t("reg.mainLink")} required err={tried && !stepValid[1]} hint={t("apply.s2.mainHint")}>
                <Input value={f.main_platform_link} onChange={(e) => set("main_platform_link")(e.target.value)} placeholder="https://" />
              </Field>
              <div>
                <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{t("claim.links")}</Label>
                <div className="mt-3 space-y-2">
                  {links.map((l, i) => (
                    <div key={i} className="grid grid-cols-[140px_1fr_auto] gap-2">
                      <Input
                        value={l.platform}
                        placeholder={t("claim.platformPh")}
                        onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))}
                      />
                      <Input
                        value={l.url}
                        placeholder="https://"
                        onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setLinks(links.filter((_, j) => j !== i))}>✕</Button>
                    </div>
                  ))}
                </div>
                {links.length < 8 && (
                  <button type="button" onClick={() => setLinks([...links, { ...EMPTY_LINK }])} className="mt-2 text-xs aipf-link">
                    {t("claim.addLink")}
                  </button>
                )}
              </div>
              <Field label={t("reg.followers")} hint={t("apply.s2.followersHint")}>
                <Input value={f.follower_count} onChange={(e) => set("follower_count")(e.target.value)} placeholder="12,000 (TikTok) · 4,500 (IG)" />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <StepIntro title={t("apply.st3")} copy={t("apply.s3.intro")} />
              <Field label={t("reg.bio")} required err={tried && f.short_bio.trim().length < 10} hint={t("apply.s3.bioHint")} count={`${f.short_bio.length}/1000`}>
                <Textarea rows={3} maxLength={1000} value={f.short_bio} onChange={(e) => set("short_bio")(e.target.value)} />
              </Field>
              <Field label={t("apply.s3.why")} required err={tried && f.why_include.trim().length < 10} count={`${f.why_include.length}/2000`}>
                <Textarea rows={4} maxLength={2000} value={f.why_include} onChange={(e) => set("why_include")(e.target.value)} />
              </Field>
              <Field label={t("apply.s3.aiNative")} hint={t("apply.s3.aiNativeHint")}>
                <Textarea rows={3} maxLength={2000} value={f.ai_native_explanation} onChange={(e) => set("ai_native_explanation")(e.target.value)} />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <StepIntro title={t("apply.st4")} copy={t("apply.s4.intro")} />
              <PortraitGuidelines entityName={f.entity_name} category={f.category} />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label={t("reg.imageUrl")} hint={t("apply.s4.imageHint")}>
                  <Input value={f.official_image_url} onChange={(e) => set("official_image_url")(e.target.value)} placeholder="https://" />
                </Field>
                <Field label={t("reg.logoUrl")}>
                  <Input value={f.logo_url} onChange={(e) => set("logo_url")(e.target.value)} placeholder="https://" />
                </Field>
              </div>
              {f.official_image_url && /^https?:\/\//.test(f.official_image_url) && (
                <div className="w-28 aspect-[3/4] border border-border overflow-hidden bg-[hsl(var(--soft-cream))]">
                  <img src={f.official_image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <GoldDivider />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label={t("reg.contactName")} required err={tried && !f.contact_name.trim()}>
                  <Input value={f.contact_name} onChange={(e) => set("contact_name")(e.target.value)} />
                </Field>
                <Field label={t("reg.contactEmail")} required err={tried && !/.+@.+\..+/.test(f.contact_email)}>
                  <Input type="email" value={f.contact_email} onChange={(e) => set("contact_email")(e.target.value)} />
                </Field>
              </div>
              <div className="space-y-3 pt-2">
                <Check checked={f.authorized} onChange={(v) => set("authorized")(v)} label={t("reg.check.authorized")} err={tried && !f.authorized} />
                <Check checked={f.understands_no_guarantee} onChange={(v) => set("understands_no_guarantee")(v)} label={t("reg.check.noGuarantee")} err={tried && !f.understands_no_guarantee} />
                <Check checked={f.newsletter_opt_in} onChange={(v) => set("newsletter_opt_in")(v)} label={t("reg.check.newsletter")} />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4 border-t border-border">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>{t("claim.back")}</Button>
            ) : (
              <Link to="/aipf/join" className="text-xs uppercase tracking-[0.16em] text-muted-foreground self-center hover:text-foreground">
                ← {t("join.title")}
              </Link>
            )}
            {step < 3 ? (
              <Button onClick={next}>{t("claim.continue")}</Button>
            ) : (
              <Button onClick={submit} disabled={busy}>{busy ? t("common.submitting") : t("apply.submit")}</Button>
            )}
          </div>
          {tried && !stepValid[step] && (
            <p className="text-xs text-destructive text-right">{t("apply.fillRequired")}</p>
          )}
        </div>
      </section>
    </>
  );
}

function StepIntro({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <p className="text-sm text-foreground/75 mt-2">{copy}</p>
    </div>
  );
}

function Field({
  label, required, err, hint, count, children,
}: {
  label: string; required?: boolean; err?: boolean; hint?: string; count?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <Label className="text-xs uppercase tracking-[0.14em] font-semibold">
          {label}{required && <span style={{ color: "hsl(var(--ceremonial-gold))" }}> *</span>}
        </Label>
        {count && <span className="text-[0.65rem] text-muted-foreground">{count}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[0.7rem] text-muted-foreground mt-1">{hint}</p>}
      {err && <p className="text-xs text-destructive mt-1">{`!`}</p>}
    </div>
  );
}

function Check({ checked, onChange, label, err }: { checked: boolean; onChange: (v: boolean) => void; label: string; err?: boolean }) {
  return (
    <label className={`flex items-start gap-3 text-sm ${err ? "text-destructive" : ""}`}>
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function Apply() {
  return <AipfLayout><Inner /></AipfLayout>;
}
