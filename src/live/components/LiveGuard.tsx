import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLiveAuth } from "@/live/LiveAuthContext";
import LiveLayout from "@/live/LiveLayout";

export default function LiveGuard({
  children,
  staffOnly = false,
}: {
  children: ReactNode;
  staffOnly?: boolean;
}) {
  const { loading, session, role, isStaff } = useLiveAuth();
  const location = useLocation();

  if (loading) {
    return (
      <LiveLayout>
        <div className="flex min-h-screen items-center justify-center live-eyebrow">Checking access…</div>
      </LiveLayout>
    );
  }

  if (!session) {
    return <Navigate to="/live/login" state={{ from: location.pathname }} replace />;
  }

  if (!role) {
    return (
      <LiveLayout>
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="live-eyebrow">No access</p>
          <h1 className="live-display text-3xl">This account is not on the Live roster.</h1>
          <p className="text-sm opacity-70">Ask an administrator to add you as a producer or guest.</p>
        </div>
      </LiveLayout>
    );
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/live" replace />;
  }

  return <>{children}</>;
}
