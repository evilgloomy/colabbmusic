import { useState } from "react";
import { Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aipf/admin/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Request failed", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
    toast({ title: "Check your inbox", description: "A password reset link has been sent." });
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-24 max-w-md">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="font-institutional text-4xl mt-3">Reset password</h1>
        <GoldDivider className="my-6" />
        <div className="aipf-frame p-8 space-y-4">
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
              Follow the link in your inbox to set a new password.
            </p>
          ) : (
            <>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button onClick={submit} disabled={busy || !email} className="w-full">
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </>
          )}
          <div className="text-xs text-muted-foreground text-center pt-2">
            <Link to="/aipf/admin/login" className="hover:underline">← Back to sign in</Link>
          </div>
        </div>
      </section>
    </AipfLayout>
  );
}
