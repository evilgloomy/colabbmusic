import { ReactNode } from "react";
import { InstitutionalHeader, AipfFooter } from "./components/Chrome";
import { AipfI18nProvider } from "./i18n";
import "./aipf.css";

export function AipfLayout({ children, hideChrome = false }: { children: ReactNode; hideChrome?: boolean }) {
  return (
    <AipfI18nProvider>
      <div className="aipf-root min-h-screen flex flex-col">
        {!hideChrome && <InstitutionalHeader />}
        <main className="flex-1">{children}</main>
        {!hideChrome && <AipfFooter />}
      </div>
    </AipfI18nProvider>
  );
}
