import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider, SealLogo } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { AIPF_CATEGORIES } from "@/aipf/lib/constants";
import { lookupInvitation, submitOnboarding } from "@/aipf/services";
import type { AipfClaimLookup, AipfClaimLinkDraft, AipfOnboardingPayload } from "@/aipf/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAipfT } from "@/aipf/i18n";

type Step = "code" | "profile" | "principles" | "oath" | "done";

const EMPTY_LINK: AipfClaimLinkDraft = { platform: "", url: "" };

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("claim.seoTitle"), description: t("claim.seoDesc"), exactTitle: true, noindex: true });
  const [params] = useSearchParams();

  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState(params.get("code") || "");
  const [checking, setChecking] = useState(false);
  const [lookup, setLookup] = useState<AipfClaimLookup | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [form, setForm] = useState({
    entity_name: "",
    creator_studio_name: "",
    country_region: "",
    category: "",
    year_launched: "",
    follower_count: "",
    contact_email: "",
    bio: "",
    official_image_url: "",
    logo_url: "",
  });
  const [links, setLinks] = useState<AipfClaimLinkDraft[]>([{ ...EMPTY_LINK }]);
  const [principlesAccepted, setPrinciplesAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ member_number?: string | null } | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  async function checkCode(value: string) {
    if (!value.trim()) return;
    setChecking(true);
    setErrorKey(null);
    const res = await lookupInvitation(value);
    setChecking(false);
    if ("unavailable" in res) { setErrorKey("claim.err.unavailable"); return; }
    if (!res.found) { setErrorKey("claim.err.notFound"); return; }
    if (!res.claimable) {
      setErrorKey(res.reason === "already_claimed" ? "claim.err.claimed" : "claim.err.notClaimable");
      return;
    }
    setLookup(res);
    setForm((f) => ({
      ...f,
      entity_name: res.entity_name || f.entity_name,
      creator_studio_name: res.creator_studio_name || f.creator_studio_name,
      country_region: res.country_region || f.country_region,
      category: res.category || f.category,
      year_launched: res.year_launched ? String(res.year_launched) : f.year_launched,
      follower_count: res.follower_count || f.follower_count,
      bio: res.bio || f.bio,
      official_image_url: res.official_image_url || f.official_image_url,
      logo_url: res.logo_url || f.logo_url,
    }));
    setStep("profile");
  }

  // Auto-check when arriving through a claim link
  useEffect(() => {
    const initial = params.get("code");
    if (initial) checkCode(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!signature.trim()) { setErrorKey("claim.err.signature"); return; }
    setSubmitting(true);
    setErrorKey(null);
    const payload: AipfOnboardingPayload = {
      ...form,
      links: links.filter((l) => l.url.trim()),
      accepted_principles: principlesAccepted,
      oath_signature: signature.trim(),
    };
    const res = await submitOnboarding(code, payload);
    setSubmitting(false);
    if (!res.ok) {
      setErrorKey(res.error === "already_submitted" ? "claim.err.claimed" : "claim.err.submitFailed");
      return;
    }
    setResult({ member_number: res.member_number ?? lookup?.member_number });
    setStep("done");
  }

  const principles = [
    t("claim.p1"), t("claim.p2"), t("claim.p3"), t("claim.p4"),
    t("claim.p5"), t("claim.p6"), t("claim.p7"),
  ];

  const stepIndex = { code: 0, profile: 1, principles: 2, oath: 3, done: 4 }[step];

  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>{t("claim.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">{t("claim.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">{t("claim.intro")}</p>
        {step !== "code" && step !== "done" && (
          <div className="mt-8 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {[t("claim.step1"), t("claim.step2"), t("claim.step3")].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="opacity-40">—</span>}
                <span className={stepIndex === i + 1 ? "text-[hsl(var(--foundation-navy))] font-semibold" : ""}>
                  {String(i + 1).padStart(2, "0")} · {s}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        {step === "code" && (
          <div className="aipf-frame p-8">
            <SectionLabel>{t("claim.codeLabel")}</SectionLabel>
            <p className="text-sm text-foreground/75 mt-2">{t("claim.codeIntro")}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AIPF-2026-XXXX-XXXX"
                className="font-mono uppercase"
                onKeyDown={(e) => { if (e.key === "Enter") checkCode(code); }}
              />
              <Button onClick={() => checkCode(code)} disabled={checking || !code.trim()}>
                {checking ? t("common.loading") : t("claim.continue")}
              </Button>
            </div>
            {errorKey && <p className="mt-4 text-sm text-destructive">{t(errorKey)}</p>}
            <GoldDivider className="my-8" />
            <p className="text-xs text-muted-foreground">
              {t("claim.noCode")}{" "}
              <Link to="/aipf/register-interest" className="aipf-link">{t("nav.register")}</Link>
            </p>
          </div>
        )}

        {step === "profile" && (
          <div className="aipf-frame p-8 space-y-6">
            <div>
              <SectionLabel>{t("claim.profileLabel")}</SectionLabel>
              <p className="text-sm text-foreground/75 mt-2">{t("claim.profileIntro")}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("reg.entityName")} required>
                <Input value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} />
              </Field>
              <Field label={t("reg.creator")}>
                <Input value={form.creator_studio_name} onChange={(e) => setForm({ ...form, creator_studio_name: e.target.value })} />
              </Field>
              <Field label={t("reg.category")}>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-10 w-full px-3 border border-input bg-background text-sm"
                >
                  <option value="">{t("common.select")}</option>
                  {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={t("reg.country")}>
                <Input value={form.country_region} onChange={(e) => setForm({ ...form, country_region: e.target.value })} />
              </Field>
              <Field label={t("reg.year")}>
                <Input type="number" value={form.year_launched} onChange={(e) => setForm({ ...form, year_launched: e.target.value })} />
              </Field>
              <Field label={t("reg.followers")}>
                <Input value={form.follower_count} onChange={(e) => setForm({ ...form, follower_count: e.target.value })} />
              </Field>
              <Field label={t("claim.contactEmail")}>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </Field>
            </div>
            <Field label={t("reg.bio")}>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("reg.imageUrl")}>
                <Input value={form.official_image_url} onChange={(e) => setForm({ ...form, official_image_url: e.target.value })} placeholder="https://" />
              </Field>
              <Field label={t("reg.logoUrl")}>
                <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://" />
              </Field>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{t("claim.links")}</Label>
              <p className="text-xs text-muted-foreground mt-1">{t("claim.linksIntro")}</p>
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
                    <Button type="button" variant="ghost" size="sm" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              {links.length < 8 && (
                <button type="button" onClick={() => setLinks([...links, { ...EMPTY_LINK }])} className="mt-2 text-xs aipf-link">
                  {t("claim.addLink")}
                </button>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep("code")}>{t("claim.back")}</Button>
              <Button onClick={() => setStep("principles")} disabled={!form.entity_name.trim()}>
                {t("claim.continue")}
              </Button>
            </div>
          </div>
        )}

        {step === "principles" && (
          <div className="aipf-frame p-8">
            <SectionLabel>{t("claim.principlesLabel")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">{t("claim.principlesTitle")}</h2>
            <GoldDivider className="my-6" />
            <ol className="space-y-4">
              {principles.map((p, i) => (
                <li key={i} className="flex gap-4 text-sm text-foreground/85">
                  <span
                    className="shrink-0 w-8 h-8 flex items-center justify-center font-institutional border"
                    style={{ borderColor: "hsl(var(--ceremonial-gold))", color: "hsl(var(--foundation-navy))" }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-1.5">{p}</span>
                </li>
              ))}
            </ol>
            <label className="mt-8 flex items-start gap-3 text-sm border-t border-border pt-6">
              <input
                type="checkbox"
                className="mt-1"
                checked={principlesAccepted}
                onChange={(e) => setPrinciplesAccepted(e.target.checked)}
              />
              <span>{t("claim.acceptPrinciples")}</span>
            </label>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep("profile")}>{t("claim.back")}</Button>
              <Button onClick={() => setStep("oath")} disabled={!principlesAccepted}>{t("claim.continue")}</Button>
            </div>
          </div>
        )}

        {step === "oath" && (
          <div className="aipf-frame p-8 md:p-12 text-center">
            <SealLogo size={64} className="mx-auto" />
            <SectionLabel className="mt-6">{t("claim.oathLabel")}</SectionLabel>
            <h2 className="font-institutional text-4xl mt-2">{t("claim.oathTitle")}</h2>
            <GoldDivider className="my-8 mx-auto" />
            <p className="font-institutional italic text-lg leading-relaxed max-w-xl mx-auto text-foreground/90">
              {t("claim.oathText")}
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-6 max-w-lg mx-auto text-left">
              <Field label={t("claim.signature")} required>
                <Input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={form.entity_name || t("claim.signaturePh")}
                  className="font-institutional italic text-lg"
                />
              </Field>
              <div>
                <Label className="text-xs uppercase tracking-[0.14em] font-semibold">{t("claim.date")}</Label>
                <div className="mt-1.5 h-10 px-3 border border-input bg-muted/30 text-sm flex items-center">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            {lookup?.member_number && (
              <p className="mt-6 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {t("claim.memberNo")} · {lookup.member_number}
              </p>
            )}
            {errorKey && <p className="mt-4 text-sm text-destructive">{t(errorKey)}</p>}
            <div className="flex justify-between mt-10">
              <Button variant="outline" onClick={() => setStep("principles")}>{t("claim.back")}</Button>
              <Button onClick={submit} disabled={submitting || !signature.trim()}>
                {submitting ? t("common.submitting") : t("claim.signSubmit")}
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="aipf-frame p-8 md:p-12 text-center">
            <SealLogo size={72} className="mx-auto" />
            <h2 className="font-institutional text-4xl mt-6">{t("claim.done.title")}</h2>
            <GoldDivider className="my-6 mx-auto" />
            {result?.member_number && (
              <div className="inline-block px-6 py-3 aipf-navy text-white">
                <div className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70">{t("claim.memberNo")}</div>
                <div className="font-institutional text-2xl mt-1 tracking-wide">{result.member_number}</div>
              </div>
            )}
            <p className="mt-6 text-foreground/80 max-w-xl mx-auto">{t("claim.done.copy")}</p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link to="/aipf/directory" className="px-6 py-3 text-xs uppercase tracking-[0.18em] bg-[hsl(var(--foundation-navy))] text-white">
                {t("nav.directory")}
              </Link>
              <Link to="/aipf/verify" className="px-6 py-3 text-xs uppercase tracking-[0.18em] border border-[hsl(var(--foundation-navy))]">
                {t("verify.title")}
              </Link>
            </div>
          </div>
        )}

        {step === "code" && errorKey === "claim.err.unavailable" && (
          <div className="mt-8">
            <EmptyState title={t("claim.unavailable.title")} copy={t("claim.unavailable.copy")} />
          </div>
        )}
      </section>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em] font-semibold">
        {label}{required && <span style={{ color: "hsl(var(--ceremonial-gold))" }}> *</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function Claim() {
  return <AipfLayout><Inner /></AipfLayout>;
}
