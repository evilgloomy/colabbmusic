import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CookieConsent } from "./CookieConsent";
import { useHtmlLang } from "@/hooks/useHtmlLang";

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  /** Let the hero run under the nav (campaign pages). */
  transparentNav?: boolean;
}

export const PageLayout = ({ children, hideFooter, transparentNav }: PageLayoutProps) => {
  useHtmlLang();
  return (
    <div className="min-h-screen bg-background">
      <Navbar transparent={transparentNav} />
      <main className={transparentNav ? "" : "pt-16"}>{children}</main>
      {!hideFooter && <Footer />}
      <CookieConsent />
    </div>
  );
};
