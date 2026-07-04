import { ReactNode } from "react";
import { InstitutionalHeader, AipfFooter } from "./components/Chrome";
import "./aipf.css";

export function AipfLayout({ children, hideChrome = false }: { children: ReactNode; hideChrome?: boolean }) {
  return (
    <div className="aipf-root min-h-screen flex flex-col">
      {!hideChrome && <InstitutionalHeader />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <AipfFooter />}
    </div>
  );
}
