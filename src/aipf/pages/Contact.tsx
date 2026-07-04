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

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  category: z.string().min(1),
  message: z.string().min(10).max(4000),
});
type V = z.infer<typeof schema>;

export default function Contact() {
  useSEO({ title: "Contact — AI People Foundation", exactTitle: true });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<V>({ resolver: zodResolver(schema) as any });

  async function onSubmit(v: V) {
    setBusy(true);
    const { error } = await createContactMessage(v);
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setDone(true);
    window.scrollTo(0, 0);
  }

  if (done) {
    return <AipfLayout><section className="container mx-auto px-6 py-24"><EmptyState title="Thank you" copy="Your message has been received." /></section></AipfLayout>;
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-2xl">
        <SectionLabel>Correspondence</SectionLabel>
        <h1 className="font-institutional text-5xl mt-3">Contact the Foundation</h1>
        <GoldDivider className="my-6" />
        <form onSubmit={handleSubmit(onSubmit)} className="aipf-frame p-8 space-y-5 mt-6">
          <div><Label>Name</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive mt-1">Required</p>}</div>
          <div><Label>Email</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-xs text-destructive mt-1">Valid email required</p>}</div>
          <div><Label>Subject</Label><Input {...register("subject")} />{errors.subject && <p className="text-xs text-destructive mt-1">Required</p>}</div>
          <div>
            <Label>Category</Label>
            <select {...register("category")} className="h-10 w-full px-3 border border-input bg-background text-sm">
              <option value="">Select…</option>
              {AIPF_CONTACT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><Label>Message</Label><Textarea rows={6} {...register("message")} />{errors.message && <p className="text-xs text-destructive mt-1">Please provide detail</p>}</div>
          <Button disabled={busy} className="w-full">{busy ? "Sending…" : "Send"}</Button>
        </form>
      </section>
    </AipfLayout>
  );
}
