import { PageLayout } from "@/components/layout/PageLayout";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";

const PoliciesPage = () => {
  const { t } = useTranslation();

  useSEO({
    title: t("policies.returnPolicy") + " — Cola B Store",
    description: t("policies.pageDesc"),
  });

  return (
    <PageLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("policies.storePolicies")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">{t("policies.returnPolicy")}</h1>
          <p className="text-muted-foreground max-w-lg">{t("policies.pageDesc")}</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 max-w-3xl">
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <p className="text-lg font-semibold text-foreground">{t("policies.allSalesFinal")}</p>
          <p className="text-muted-foreground">{t("policies.allSalesFinalDesc")}</p>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.damagedTitle")}</h2>
            <p className="text-muted-foreground mb-3">
              Please inspect your order on delivery and email{" "}
              <a href="mailto:cola.bb.225@gmail.com" className="text-primary hover:underline">cola.bb.225@gmail.com</a>{" "}
              within <strong className="text-foreground">7 days</strong> if an item is defective, damaged, or you received the wrong item. Include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Order number</li>
              <li>A brief description of the issue</li>
              <li>Clear photos of the item, packaging, and shipping label</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              If your claim is approved, we will offer a <strong className="text-foreground">replacement</strong> (subject to stock). If a replacement isn't possible, we may issue a <strong className="text-foreground">refund or store credit</strong> at our discretion.
            </p>
          </div>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.conditionTitle")}</h2>
            <p className="text-muted-foreground">
              For approved returns only — items must be unused, unworn, unwashed, with all tags attached and in original packaging. Items sent back without prior approval will not be accepted.
            </p>
          </div>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.nonReturnableTitle")}</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Final-sale or discounted items</li>
              <li>Gift cards and digital goods</li>
              <li>Personalized/custom items</li>
              <li>Intimate or personal care items</li>
              <li>Hazardous materials, flammable liquids, or gases</li>
            </ul>
            <p className="text-muted-foreground mt-3">If you're unsure whether your item qualifies, email us before sending anything back.</p>
          </div>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.euTitle")}</h2>
            <p className="text-muted-foreground">
              If your order ships <strong className="text-foreground">into the European Union</strong>, you have the right to cancel or return within <strong className="text-foreground">14 days</strong> of receipt for any reason. Items must be unused, with tags, and in original packaging. Contact{" "}
              <a href="mailto:cola.bb.225@gmail.com" className="text-primary hover:underline">cola.bb.225@gmail.com</a>{" "}to initiate your EU return.
            </p>
          </div>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.returnShippingTitle")}</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>If we made a mistake or the item is defective: we'll provide a prepaid label.</li>
              <li>In all other approved cases (e.g., EU cooling-off), shipping costs are your responsibility.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.refundsTitle")}</h2>
            <p className="text-muted-foreground">
              We'll notify you after inspection. If approved, refunds are issued to your original payment method within <strong className="text-foreground">10 business days</strong>.
            </p>
          </div>

          <div className="pt-6 border-t border-border/40">
            <h2 className="text-display-sm font-display font-bold text-foreground mb-4">{t("policies.needHelp")}</h2>
            <p className="text-muted-foreground">
              We're here for you:{" "}
              <a href="mailto:cola.bb.225@gmail.com" className="text-primary hover:underline">cola.bb.225@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PoliciesPage;
