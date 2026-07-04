import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { AIPF_DICTS, AIPF_LANGS, type AipfLang } from "./dict";

const STORAGE_KEY = "aipf-lang";

interface Ctx {
  lang: AipfLang;
  setLang: (l: AipfLang) => void;
  t: (key: string) => string;
}

const AipfI18nContext = createContext<Ctx | null>(null);

function detectInitial(): AipfLang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as AipfLang | null;
  if (saved && AIPF_DICTS[saved]) return saved;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

export function AipfI18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AipfLang>("en");

  useEffect(() => {
    setLangState(detectInitial());
  }, []);

  const setLang = useCallback((l: AipfLang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string) => AIPF_DICTS[lang][key] ?? AIPF_DICTS.en[key] ?? key,
    [lang]
  );

  return (
    <AipfI18nContext.Provider value={{ lang, setLang, t }}>{children}</AipfI18nContext.Provider>
  );
}

export function useAipfT() {
  const ctx = useContext(AipfI18nContext);
  if (!ctx) {
    // Fallback for admin routes that don't wrap the provider
    return { lang: "en" as AipfLang, setLang: () => {}, t: (k: string) => AIPF_DICTS.en[k] ?? k };
  }
  return ctx;
}

export function AipfLanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useAipfT();
  return (
    <div className={`flex items-center gap-1 text-[0.68rem] uppercase tracking-[0.22em] ${className}`}>
      {AIPF_LANGS.map((l, i) => (
        <span key={l.code} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-30">·</span>}
          <button
            type="button"
            onClick={() => setLang(l.code)}
            className={`transition-colors ${
              lang === l.code
                ? "text-[hsl(var(--foundation-navy))] font-semibold"
                : "opacity-60 hover:opacity-100"
            }`}
            aria-label={`Switch language to ${l.label}`}
          >
            {l.short}
          </button>
        </span>
      ))}
    </div>
  );
}
