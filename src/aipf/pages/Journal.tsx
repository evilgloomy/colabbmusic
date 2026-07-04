import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { EmptyState } from "@/aipf/components/Directory";
import { listPublishedPosts, getPostBySlug } from "@/aipf/services";
import type { AipfJournalPost } from "@/aipf/types";

export function Journal() {
  useSEO({ title: "Journal — AI People Foundation", exactTitle: true });
  const [posts, setPosts] = useState<AipfJournalPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listPublishedPosts().then((p) => { setPosts(p); setLoading(false); }); }, []);

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>Updates</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">Journal</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">
          Foundation updates, creator spotlights, research notes, directory announcements, and
          Founding Cohort updates.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-4xl">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <EmptyState title="No entries yet" copy="Foundation updates will appear here." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
            {posts.map((p) => (
              <li key={p.id} className="py-8">
                <SectionLabel>{p.post_type || "Foundation update"}</SectionLabel>
                <Link to={`/aipf/journal/${p.slug}`}>
                  <h2 className="font-institutional text-3xl mt-2 hover:text-[hsl(var(--foundation-navy))]">{p.title}</h2>
                </Link>
                {p.excerpt && <p className="text-foreground/80 mt-3">{p.excerpt}</p>}
                <Link to={`/aipf/journal/${p.slug}`} className="aipf-link text-sm mt-3 inline-block">Read →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AipfLayout>
  );
}

export function JournalPost() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<AipfJournalPost | null | undefined>(undefined);
  useEffect(() => { getPostBySlug(slug).then(setPost); }, [slug]);

  useSEO({
    title: post ? `${post.title} — AIPF Journal` : "AIPF Journal",
    description: post?.excerpt || undefined,
    exactTitle: true,
    type: "article",
  });

  if (post === undefined) return <AipfLayout><div className="container mx-auto px-6 py-24 text-muted-foreground text-center">Loading…</div></AipfLayout>;
  if (!post) return <AipfLayout><div className="container mx-auto px-6 py-24"><EmptyState title="Post not found" copy="This entry may have been removed." /></div></AipfLayout>;

  return (
    <AipfLayout>
      <article className="container mx-auto px-6 py-16 max-w-2xl">
        <Link to="/aipf/journal" className="text-xs uppercase tracking-[0.16em] text-muted-foreground">← Journal</Link>
        <SectionLabel className="mt-6">{post.post_type || "Foundation update"}</SectionLabel>
        <h1 className="font-institutional text-4xl md:text-5xl mt-2">{post.title}</h1>
        <GoldDivider className="my-6" />
        {post.excerpt && <p className="text-lg text-foreground/85 italic mb-6">{post.excerpt}</p>}
        {post.content && (
          <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        )}
      </article>
    </AipfLayout>
  );
}
