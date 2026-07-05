import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { useAipfAuth } from "@/aipf/AipfAuthContext";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const nav = useNavigate();
  const { signIn, signUp, session } = useAipfAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) nav("/aipf/admin", { replace: true });

  async function submit() {
    setBusy(true);
    const { error } = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) return toast({ title: "Auth failed", description: error, variant: "destructive" });
    if (mode === "up") {
      toast({ title: "Account created", description: "You can sign in now. An AIPF admin must promote your role before you can access the dashboard." });
      setMode("in");
    } else {
      nav("/aipf/admin", { replace: true });
    }
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-24 max-w-md">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="font-institutional text-4xl mt-3">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <GoldDivider className="my-6" />
        <div className="aipf-frame p-8 space-y-4">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "in" ? "No account? Create one." : "Have an account? Sign in."}
          </button>
          {mode === "in" && (
            <Link
              to="/aipf/admin/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground w-full text-center block"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          <Link to="/aipf" className="hover:underline">← Back to AIPF</Link>
        </p>
      </section>
    </AipfLayout>
  );
}
