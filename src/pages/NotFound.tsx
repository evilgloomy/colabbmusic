import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";

const NotFound = () => {
  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-hero font-display font-bold text-primary/30 mb-4">404</h1>
          <p className="text-xl font-display text-foreground mb-6">Page not found</p>
          <Link
            to="/"
            className="px-8 py-3 bg-primary text-primary-foreground text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-primary/90 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default NotFound;