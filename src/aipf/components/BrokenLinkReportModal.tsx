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
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report received", description: "The Foundation will review this shortly." });
    onOpenChange(false);
    setEmail("");
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="aipf-root">
        <DialogHeader>
          <DialogTitle className="font-institutional text-2xl">Report a broken link</DialogTitle>
          <DialogDescription>
            Help the Foundation keep the public record accurate. {link ? `Reporting: ${link.url}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Your email (optional)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label>Issue type</Label>
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
            <Label>Details</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
