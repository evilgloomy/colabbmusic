import { PageLayout } from "@/components/layout/PageLayout";
import { useSEO } from "@/hooks/useSEO";

const PrivacyPage = () => {
  useSEO({
    title: "Privacy Policy — Cola B",
    description: "How Cola B collects, uses, and protects your information.",
  });

  return (
    <PageLayout>
      <section className="editorial pt-24 pb-12 max-w-3xl">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Legal</p>
        <h1 className="text-display-lg font-display font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Draft — placeholder copy. To be replaced with lawyer-reviewed text before launch.
        </p>
      </section>

      <section className="editorial pb-24 max-w-3xl space-y-8 text-foreground/80 font-body leading-relaxed">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Information we collect</h2>
          <p>
            When you visit colabbmusic.com we collect basic technical information (IP address, browser type,
            referring page, pages viewed) via analytics cookies. If you make a purchase we collect order and
            shipping details required to fulfill it. If you sign in to chat we store your account email and
            messages.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">2. Cookies & analytics</h2>
          <p>
            We use Google Analytics 4 and Meta (Facebook) Pixel to understand how the site is used and to
            measure marketing performance. These tools only load after you click "Accept" on the consent
            banner. If you click "Reject" no analytics or advertising cookies are set.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Third-party services</h2>
          <p>
            We share data only with the providers required to run the site: Google (analytics), Meta
            (advertising measurement), Shopify (store and payments), and our hosting and database providers.
            Each operates under its own privacy policy.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">4. Your rights</h2>
          <p>
            You may request access, correction, or deletion of your personal data at any time. EU/UK users
            have additional rights under GDPR including the right to object and the right to data
            portability. To exercise these rights email us at the address below.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Contact</h2>
          <p>
            Questions about privacy: <a href="mailto:cola.bb.225@gmail.com" className="underline">cola.bb.225@gmail.com</a>.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default PrivacyPage;
