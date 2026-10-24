import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCachedTopicTree,
  getBlogBySlug,
  getPrevNextBlogs,
  getRelatedBlogs,
  findTopicInTree,
} from "@/lib/queries";
import { adminDb } from "@/lib/firebase/admin";
import { TopicSidebar } from "@/components/topic-sidebar";
import { TableOfContents } from "@/components/table-of-contents";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import { ArticleActions } from "@/components/article-actions";
import {
  Calendar,
  Clock,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import type { TableOfContentsItem } from "@/types";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const snap = await adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .limit(20)
      .get();

    return snap.docs.map((doc) => ({
      slug: doc.data().slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: "Article Not Found" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const canonicalUrl = `${siteUrl}/blog/${blog.slug}`;

  return {
    title: blog.title,
    description: blog.excerpt || `Read ${blog.title} on Bilbili.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: "article",
      url: canonicalUrl,
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      tags: blog.tags,
    },
    twitter: {
      card: "summary",
      title: blog.title,
      description: blog.excerpt,
    },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const [tree, { prev, next }, related] = await Promise.all([
    getCachedTopicTree(),
    getPrevNextBlogs(blog.subtopicId, blog.publishedAt || blog.createdAt),
    getRelatedBlogs(blog, 3),
  ]);

  // Extract table of contents from subtitle blocks
  const tocItems: TableOfContentsItem[] = (blog.blocks || [])
    .filter((b) => b.type === "subtitle")
    .map((b) => ({
      id: b.id,
      text: b.text,
      level: 2,
    }));

  // Resolve breadcrumbs
  const breadcrumbs: { id: string; name: string; slug: string }[] = [];
  for (const topicId of blog.topicPath || []) {
    const node = findTopicInTree(tree, topicId);
    if (node) {
      breadcrumbs.push({ id: node.id, name: node.name, slug: node.slug });
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // JSON-LD structured data
  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": "Organization",
      name: "Bilbili Educational Archive",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Bilbili",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${blog.slug}`,
    },
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      ...breadcrumbs.map((b, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: b.name,
        item: `${siteUrl}/topic/${b.slug || b.id}`,
      })),
      {
        "@type": "ListItem",
        position: breadcrumbs.length + 2,
        name: blog.title,
        item: `${siteUrl}/blog/${blog.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />

      {/* 3-Column Layout: Sidebar (260px) + Reading Column (max 720px) + Sticky TOC (220px) */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start justify-center">
        {/* Topic Tree Sidebar */}
        <TopicSidebar tree={tree} activeTopicId={blog.subtopicId} />

        {/* Central Reading Column (max 720px) */}
        <article className="reading-column flex-1 min-w-0">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumbs"
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-4 flex-wrap"
          >
            <Link href="/" className="hover:text-[var(--text-primary)] hover:underline">
              Home
            </Link>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/topic/${b.slug || b.id}`}
                  className="hover:text-[var(--text-primary)] hover:underline"
                >
                  {b.name}
                </Link>
              </span>
            ))}
          </nav>

          {/* Article Header */}
          <header className="pb-6 border-b border-[var(--border-color)] mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight mb-4">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)]">
              {blog.updatedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Updated{" "}
                    {new Date(blog.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{blog.readingTime} min read</span>
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {blog.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] font-mono text-[11px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Blocks Content */}
          <div className="article-body">
            <BlockRenderer blocks={blog.blocks || []} />
          </div>

          {/* References Section */}
          {blog.references && blog.references.length > 0 && (
            <section className="mt-12 pt-6 border-t border-[var(--border-color)]" aria-labelledby="references-heading">
              <h2 id="references-heading" className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                <span>References and Citations</span>
              </h2>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)] list-decimal pl-5">
                {blog.references.map((ref, idx) => (
                  <li key={idx}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{ref.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Acknowledgement Section */}
          {blog.acknowledgement && (
            <section className="mt-8 p-4 rounded border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)]" aria-label="Acknowledgements">
              <div className="font-semibold text-[var(--text-primary)] mb-1 uppercase tracking-wider text-[11px]">
                Acknowledgements
              </div>
              <p className="leading-relaxed">{blog.acknowledgement}</p>
            </section>
          )}

          {/* Article Actions (Bookmark, Copy Link, Native Share, Back to top) */}
          <ArticleActions
            blog={{
              id: blog.id,
              title: blog.title,
              slug: blog.slug,
              excerpt: blog.excerpt,
              readingTime: blog.readingTime,
            }}
          />

          {/* Previous / Next in Same Subtopic */}
          {(prev || next) && (
            <nav
              aria-label="Subtopic sequence navigation"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8"
            >
              {prev ? (
                <Link
                  href={`/blog/${prev.slug}`}
                  className="p-4 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors flex flex-col justify-between group"
                >
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mb-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous in sequence
                  </span>
                  <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  href={`/blog/${next.slug}`}
                  className="p-4 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors flex flex-col justify-between group sm:text-right"
                >
                  <span className="text-xs text-[var(--text-secondary)] flex items-center justify-end gap-1 mb-1">
                    Next in sequence <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}

          {/* Related Articles */}
          {related && related.length > 0 && (
            <section className="mt-10 pt-6 border-t border-[var(--border-color)]" aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-base font-bold text-[var(--text-primary)] mb-4">
                Related Curriculum Notes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="p-3 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors flex flex-col justify-between group"
                  >
                    <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)] mt-2">
                      {r.readingTime} min read
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sticky Desktop Table of Contents (220px) */}
        <TableOfContents items={tocItems} />
      </div>
    </>
  );
}
