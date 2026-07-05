import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash on load and fires a session event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check current session (link may already be processed).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    if (password.length < 8) {
      return toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
    }
    if (password !== confirm) {
      return toast({ title: "Passwords don't match", variant: "destructive" });
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Password updated", description: "You're signed in." });
    nav("/aipf/admin", { replace: true });
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-24 max-w-md">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="font-institutional text-4xl mt-3">Set new password</h1>
        <GoldDivider className="my-6" />
        <div className="aipf-frame p-8 space-y-4">
          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Waiting for the recovery link to validate… If nothing happens, request a new{" "}
              <Link to="/aipf/admin/forgot-password" className="underline">reset link</Link>.
            </p>
          ) : (
            <>
              <div>
                <Label>New password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button onClick={submit} disabled={busy} className="w-full">
                {busy ? "Updating…" : "Update password"}
              </Button>
            </>
          )}
        </div>
      </section>
    </AipfLayout>
  );
}
