import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AIPF_BROKEN_LINK_ISSUES } from "@/aipf/lib/constants";
import { createBrokenLinkReport } from "@/aipf/services";
import type { AipfEntity, AipfEntityLink } from "@/aipf/types";
import { toast } from "@/hooks/use-toast";
import { useAipfT } from "@/aipf/i18n";

export function BrokenLinkReportModal({
  open,
  onOpenChange,
  entity,
  link,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: AipfEntity;
  link?: AipfEntityLink | null;
}) {
  const { t } = useAipfT();
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState(AIPF_BROKEN_LINK_ISSUES[0]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } = await createBrokenLinkReport({
      entity_id: entity.id.startsWith("mock-") ? null : entity.id,
      entity_link_id: link?.id?.startsWith("mock-") ? null : link?.id ?? null,
      reporter_email: email || null,
      issue_type: issue,
      message,
    });
    setBusy(false);
    if (error) {
      toast({ title: t("bl.error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("bl.received.t"), description: t("bl.received.c") });
    onOpenChange(false);
    setEmail("");
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="aipf-root">
        <DialogHeader>
          <DialogTitle className="font-institutional text-2xl">{t("bl.title")}</DialogTitle>
          <DialogDescription>
            {t("bl.desc")} {link ? `${t("bl.reporting")} ${link.url}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("bl.emailLabel")}</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label>{t("bl.issueLabel")}</Label>
            <Select value={issue} onValueChange={(v) => setIssue(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AIPF_BROKEN_LINK_ISSUES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("bl.details")}</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? t("common.submitting") : t("bl.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
