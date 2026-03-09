import { Link } from "react-router-dom";
import { brand } from "@/data/content";
import { Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container mx-auto px-6 py-12">
        {/* Studio line */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="font-display text-sm font-medium text-foreground">
              {brand.studioName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Independent creative studio behind Cola B.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground mb-6">
          <Link to="/story" className="hover:text-foreground transition-colors">About Cola B</Link>
          <Link to="/press" className="hover:text-foreground transition-colors">Press Kit</Link>
          <a href="mailto:press@colabmusic.com" className="hover:text-foreground transition-colors">Contact</a>
          <span className="hover:text-foreground transition-colors cursor-pointer">FAQ</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">Shipping & Returns</span>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} Cola B. All rights reserved.
          </p>
          <div className="flex gap-4 text-[11px] text-muted-foreground/60">
            <span className="hover:text-muted-foreground transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-muted-foreground transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};