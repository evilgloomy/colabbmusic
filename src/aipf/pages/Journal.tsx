import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { listPublishedPosts, getPostBySlug } from "@/aipf/services";
import type { AipfJournalPost } from "@/aipf/types";
import { useAipfT } from "@/aipf/i18n";

function JournalInner() {
  const { t } = useAipfT();
  useSEO({ title: t("jour.seoTitle"), exactTitle: true });
  const [posts, setPosts] = useState<AipfJournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listPublishedPosts().then((p) => { setPosts(p); setLoading(false); }); }, []);

  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>{t("jour.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("jour.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">{t("jour.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-4xl">
        {loading ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : posts.length === 0 ? (
          <EmptyState title={t("jour.empty.title")} copy={t("jour.empty.copy")} />
        ) : (
          <ul className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {posts.map((p) => (
              <li key={p.id} className="py-8">
                <SectionLabel>{p.post_type || t("jour.defaultType")}</SectionLabel>
                <Link to={`/aipf/journal/${p.slug}`}>
                  <h2 className="font-institutional text-3xl mt-2 hover:text-[hsl(var(--foundation-navy))]">{p.title}</h2>
                </Link>
                {p.excerpt && <p className="text-foreground/80 mt-3">{p.excerpt}</p>}
                <Link to={`/aipf/journal/${p.slug}`} className="aipf-link text-sm mt-3 inline-block">{t("jour.read")}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function Journal() {
  return <AipfLayout><JournalInner /></AipfLayout>;
}

function PostInner() {
  const { t } = useAipfT();
  const { slug = "" } = useParams();
  const [post, setPost] = useState<AipfJournalPost | null | undefined>(undefined);
  useEffect(() => { getPostBySlug(slug).then(setPost); }, [slug]);

  useSEO({
    title: post ? `${post.title} — AIPF Journal` : "AIPF Journal",
    description: post?.excerpt || undefined,
    exactTitle: true,
    type: "article",
  });

  if (post === undefined) return <div className="container mx-auto px-6 py-24 text-muted-foreground text-center">{t("common.loading")}</div>;
  if (!post) return <div className="container mx-auto px-6 py-24"><EmptyState title={t("jour.notFound.title")} copy={t("jour.notFound.copy")} /></div>;

  return (
    <article className="container mx-auto px-6 py-16 max-w-2xl">
      <Link to="/aipf/journal" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("jour.back")}</Link>
      <SectionLabel className="mt-6">{post.post_type || t("jour.defaultType")}</SectionLabel>
      <h1 className="font-institutional text-4xl md:text-5xl mt-2">{post.title}</h1>
      <GoldDivider className="my-6" />
      {post.excerpt && <p className="text-lg text-foreground/85 italic mb-6">{post.excerpt}</p>}
      {post.content && (
        <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      )}
    </article>
  );
}

export function JournalPost() {
  return <AipfLayout><PostInner /></AipfLayout>;
}
