import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface EmailSignupProps {
  source: string;
  variant?: "inline" | "stacked";
  headline?: string;
  subhead?: string;
  className?: string;
}

export const EmailSignup = ({
  source,
  variant = "inline",
  headline,
  subhead,
  className = "",
}: EmailSignupProps) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(t("newsletter.errorInvalid"));
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe", {
        body: { email: trimmed, source, locale: i18n.language },
      });

      if (error) throw error;

      if (data?.alreadySubscribed) {
        toast.success(t("newsletter.alreadySubscribed"));
      } else if (data?.ok) {
        toast.success(t("newsletter.success"));
        setEmail("");
      } else {
        throw new Error("unexpected response");
      }
    } catch (err) {
      console.error("[EmailSignup] submit failed", err);
      toast.error(t("newsletter.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  const isStacked = variant === "stacked";

  return (
    <div className={className}>
      {(headline || subhead) && (
        <div className="mb-4">
          {headline && (
            <p className="font-display text-base md:text-lg font-bold text-foreground tracking-tight">
              {headline}
            </p>
          )}
          {subhead && (
            <p className="text-xs text-muted-foreground mt-1 font-body max-w-sm">{subhead}</p>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={isStacked ? "flex flex-col gap-2 max-w-sm" : "flex flex-col sm:flex-row gap-2 max-w-md"}
      >
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("newsletter.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="rounded-none border-foreground/20 focus-visible:ring-0 focus-visible:border-foreground/60 h-10 text-sm font-body"
          aria-label={t("newsletter.placeholder")}
        />
        <Button
          type="submit"
          disabled={submitting}
          className="rounded-none h-10 px-6 text-xs font-body font-semibold tracking-[0.15em] uppercase bg-foreground text-background hover:opacity-90"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("newsletter.cta")}
        </Button>
      </form>
    </div>
  );
};
