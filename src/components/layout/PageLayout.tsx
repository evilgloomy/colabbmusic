import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CookieConsent } from "./CookieConsent";
import { useHtmlLang } from "@/hooks/useHtmlLang";

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const PageLayout = ({ children, hideFooter }: PageLayoutProps) => {
  useHtmlLang();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">{children}</main>
      {!hideFooter && <Footer />}
      <CookieConsent />
    </div>
  );
};
