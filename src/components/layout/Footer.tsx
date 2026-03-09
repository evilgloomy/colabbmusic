import { Link } from "react-router-dom";
import { brand } from "@/data/content";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40">
      {/* Studio section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
            {brand.studioName}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {brand.studioStatement}
          </p>
        </div>
      </div>

      {/* Footer links */}
      <div className="border-t border-border/20">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">Navigate</p>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                <Link to="/music" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Music</Link>
                <Link to="/story" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Story</Link>
                <Link to="/videos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Videos</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">More</p>
              <div className="flex flex-col gap-2">
                <Link to="/store" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Store</Link>
                <Link to="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Press</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">Legal</p>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Privacy Policy</span>
                <span className="text-sm text-muted-foreground">Terms</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">Connect</p>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Instagram</span>
                <span className="text-sm text-muted-foreground">TikTok</span>
                <span className="text-sm text-muted-foreground">YouTube</span>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border/20 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {brand.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
