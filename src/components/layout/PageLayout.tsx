import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const PageLayout = ({ children, hideFooter }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};
