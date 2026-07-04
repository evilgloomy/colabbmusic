import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { AIPF_CONTACT_CATEGORIES } from "@/aipf/lib/constants";
import { createContactMessage } from "@/aipf/services";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAipfT } from "@/aipf/i18n";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  category: z.string().min(1),
  message: z.string().min(10).max(4000),
});
type V = z.infer<typeof schema>;

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("contact.seoTitle"), exactTitle: true });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as any });

  async function onSubmit(v: V) {
    setBusy(true);
    const { error } = await createContactMessage(v);
    setBusy(false);
    if (error) return toast({ title: t("contact.failed"), description: error.message, variant: "destructive" });
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return <section className="container mx-auto px-6 py-24"><EmptyState title={t("contact.done.title")} copy={t("contact.done.copy")} /></section>;
  }

  return (
    <section className="container mx-auto px-6 py-16 max-w-2xl">
      <SectionLabel>{t("contact.label")}</SectionLabel>
      <h1 className="font-institutional text-5xl mt-3">{t("contact.title")}</h1>
      <GoldDivider className="my-6" />
      <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-5 mt-6">
        <div><Label>{t("contact.name")}</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">{t("common.required")}</p>}</div>
        <div><Label>{t("contact.email")}</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">{t("common.validEmail")}</p>}</div>
        <div><Label>{t("contact.subject")}</Label><Input {...register("subject")} />{errors.subject && <p className="text-xs text-destructive mt-1">{t("common.required")}</p>}</div>
        <div>
          <Label>{t("contact.category")}</Label>
          <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
            <option value="">{t("common.select")}</option>
            {AIPF_CONTACT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>{t("contact.message")}</Label><Textarea rows={6} {...register("message")} />{errors.message && <p className="text-xs text-destructive mt-1">{t("common.provideDetail")}</p>}</div>
        <Button disabled={busy} className="w-full">{busy ? t("common.sending") : t("contact.send")}</Button>
      </form>
    </section>
  );
}

export default function Contact() {
  return <AipfLayout><Inner /></AipfLayout>;
}
