import { PageLayout } from "@/components/layout/PageLayout";
import { useSEO } from "@/hooks/useSEO";

const TermsPage = () => {
  useSEO({
    title: "Terms of Service — Cola B",
    description: "Terms governing your use of the Cola B website and store.",
  });

  return (
    <PageLayout>
      <section className="editorial pt-24 pb-12 max-w-3xl">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Legal</p>
        <h1 className="text-display-lg font-display font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Draft — placeholder copy. To be replaced with lawyer-reviewed text before launch.
        </p>
      </section>

      <section className="editorial pb-24 max-w-3xl space-y-8 text-foreground/80 font-body leading-relaxed">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">1. Acceptance</h2>
          <p>
            By accessing colabbmusic.com you agree to these terms. If you do not agree, please do not use
            the site.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">2. Intellectual property</h2>
          <p>
            All music, lyrics, video, photography, artwork, and written content on this site are owned by
            Cola B and Shiba Inu Media or licensed for use here. Personal listening and sharing of links is
            welcome; reproduction, redistribution, or commercial use without written permission is not.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">3. Store purchases</h2>
          <p>
            Orders placed through the store are subject to our shipping and returns policy. All sales are
            final unless an item arrives damaged.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">4. User accounts</h2>
          <p>
            You are responsible for keeping your account credentials secure and for activity that occurs
            under your account.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">5. Disclaimer & liability</h2>
          <p>
            The site is provided "as is" without warranties of any kind. To the maximum extent permitted by
            law, Cola B and Shiba Inu Media are not liable for indirect or consequential damages arising
            from use of the site.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">6. Contact</h2>
          <p>
            Questions: <a href="mailto:cola.bb.225@gmail.com" className="underline">cola.bb.225@gmail.com</a>.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default TermsPage;
