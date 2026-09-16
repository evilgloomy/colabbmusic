import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import LiveLayout from "@/live/LiveLayout";
import { useLiveAuth } from "@/live/LiveAuthContext";

export default function LiveLogin() {
  const { session, signIn, loading } = useLiveAuth();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) {
    return <Navigate to={location.state?.from || "/live"} replace />;
  }

  return (
    <LiveLayout title="Sign in">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <p className="live-eyebrow">Cola B · Private</p>
        <h1 className="live-display mt-3 text-4xl">Live Interview Room</h1>
        <p className="mt-3 text-sm opacity-60">Invitation only. There is no public sign-up.</p>

        <form
          className="mt-10 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const res = await signIn(email.trim(), password);
            setBusy(false);
            if (res.error) setError(res.error);
          }}
        >
          <div>
            <label className="live-eyebrow" htmlFor="live-email">Email</label>
            <input
              id="live-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="live-panel mt-2 w-full bg-transparent px-4 py-3 text-sm outline-none"
            />
          </div>
          <div>
            <label className="live-eyebrow" htmlFor="live-password">Password</label>
            <input
              id="live-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="live-panel mt-2 w-full bg-transparent px-4 py-3 text-sm outline-none"
            />
          </div>
          {error && <p className="live-accent text-sm">{error}</p>}
          <button type="submit" className="live-btn w-full" disabled={busy}>
            {busy ? "Signing in…" : "Enter"}
          </button>
        </form>
      </main>
    </LiveLayout>
  );
}
