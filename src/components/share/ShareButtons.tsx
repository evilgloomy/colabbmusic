import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Link as LinkIcon, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { trackShareClick } from "@/lib/analytics";
import { SocialIcon } from "@/lib/socialIcons";

interface ShareButtonsProps {
  url: string;
  title: string;
  text?: string;
  contentType: "release" | "story" | "page";
  contentId: string;
  className?: string;
}

export const ShareButtons = ({
  url,
  title,
  text,
  contentType,
  contentId,
  className = "",
}: ShareButtonsProps) => {
  const { t } = useTranslation();
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const handleNative = async () => {
    try {
      await navigator.share({ title, text: text || title, url });
      trackShareClick("native", contentType, contentId);
    } catch {
      // user dismissed — no-op
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShareClick("copy", contentType, contentId);
      toast.success(t("share.linkCopied", "Link copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("share.copyFailed", "Couldn't copy link"));
    }
  };

  const targets = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l.36.572-1.001 3.654 3.745-.985.394.234zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
    },
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
    },
    {
      key: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <SocialIcon platform="facebook" className="h-4 w-4" />,
    },
    {
      key: "email",
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text ? text + "\n\n" : ""}${url}`)}`,
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  if (canNativeShare) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={handleNative}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-body font-semibold tracking-[0.15em] uppercase border border-foreground/20 text-foreground hover:border-foreground/60 transition-colors"
        >
          <Share2 className="h-4 w-4" /> {t("share.share", "Share")}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground mr-1">
        {t("share.share", "Share")}
      </span>
      {targets.map((tgt) => (
        <a
          key={tgt.key}
          href={tgt.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={tgt.label}
          onClick={() => trackShareClick(tgt.key, contentType, contentId)}
          className="inline-flex items-center justify-center w-9 h-9 border border-border/60 hover:border-foreground/40 text-muted-foreground hover:text-foreground transition-colors"
        >
          {tgt.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t("share.copyLink", "Copy link")}
        className="inline-flex items-center justify-center w-9 h-9 border border-border/60 hover:border-foreground/40 text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-foreground" /> : <LinkIcon className="h-4 w-4" />}
      </button>
    </div>
  );
};
