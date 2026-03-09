import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";

const NotFound = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-32 md:py-48 text-center">
        <h1 className="text-hero font-display font-bold text-foreground mb-6">404</h1>
        <p className="text-muted-foreground mb-8">This page doesn't exist.</p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </PageLayout>
  );
};

export default NotFound;
