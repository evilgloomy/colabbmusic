import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Keeps <html lang="..."> in sync with the active i18n language.
 */
export function useHtmlLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const apply = () => {
      document.documentElement.lang = i18n.language || "en";
    };
    apply();
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, [i18n]);
}
