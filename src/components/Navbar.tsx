import { Link } from "react-router-dom";
import { CartDrawer } from "./CartDrawer";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          Cola B
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <a href="#products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Shop
          </a>
        </div>
        <CartDrawer />
      </div>
    </nav>
  );
};
