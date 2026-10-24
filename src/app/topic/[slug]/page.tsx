import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCachedTopicTree, findTopicInTree, getBlogsByTopic } from "@/lib/queries";
import { TopicSidebar } from "@/components/topic-sidebar";
import { LatestBlogsList } from "@/components/latest-blogs-list";
import { ChevronRight, Folder, Layers } from "lucide-react";

interface TopicPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateStaticParams() {
  const tree = await getCachedTopicTree();
  const slugs: string[] = [];

  function collectSlugs(nodes: typeof tree) {
    for (const node of nodes) {
      if (node.slug) slugs.push(node.slug);
      if (node.children) collectSlugs(node.children);
    }
  }

  collectSlugs(tree);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tree = await getCachedTopicTree();
  const topic = findTopicInTree(tree, slug);

  if (!topic) {
    return { title: "Topic Not Found" };
  }

  return {
    title: topic.name,
    description: `Browse articles and learning resources in ${topic.name}. Unlimited depth educational topic curriculum.`,
    openGraph: {
      title: `${topic.name} | Bilbili`,
      description: `Curriculum and notes for ${topic.name}.`,
    },
  };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const sortOrder = sort === "asc" ? "asc" : "desc";

  const tree = await getCachedTopicTree();
  const topic = findTopicInTree(tree, slug);

  if (!topic) {
    notFound();
  }

  const { blogs, nextCursor } = await getBlogsByTopic(topic.id, 10, sortOrder);

  // Build breadcrumbs path
  const breadcrumbs: { id: string; name: string; slug: string }[] = [];
  for (const ancestorId of topic.ancestors || []) {
    const aNode = findTopicInTree(tree, ancestorId);
    if (aNode) {
      breadcrumbs.push({ id: aNode.id, name: aNode.name, slug: aNode.slug });
    }
  }
  breadcrumbs.push({ id: topic.id, name: topic.name, slug: topic.slug });

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
      <TopicSidebar tree={tree} activeTopicId={topic.id} />

      <div className="flex-1 min-w-0">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-4 flex-wrap">
          <Link href="/" className="hover:text-[var(--text-primary)] hover:underline">
            Home
          </Link>
          {breadcrumbs.map((b, idx) => (
            <span key={b.id} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-[var(--text-primary)] font-medium">{b.name}</span>
              ) : (
                <Link href={`/topic/${b.slug || b.id}`} className="hover:text-[var(--text-primary)] hover:underline">
                  {b.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Topic Header */}
        <div className="pb-6 border-b border-[var(--border-color)] mb-8">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] mb-1">
            <span>LEVEL {topic.level}</span>
            {topic.id.length === 6 && (
              <>
                <span>•</span>
                <span>ID: {topic.id}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {topic.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {topic.blogCount} {topic.blogCount === 1 ? "article published" : "articles published across all subtopics"}
          </p>
        </div>

        {/* Child Subtopics Section (if any) */}
        {topic.children && topic.children.length > 0 && (
          <section className="mb-10" aria-labelledby="subtopics-heading">
            <h2 id="subtopics-heading" className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Subtopics</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topic.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/topic/${child.slug || child.id}`}
                  className="p-3.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors flex items-center justify-between"
                >
                  <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                    {child.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-secondary)] font-mono shrink-0 ml-2">
                    {child.blogCount}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Articles Section with Sort Toggle */}
        <section aria-labelledby="topic-articles-heading">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-6">
            <h2 id="topic-articles-heading" className="text-lg font-bold text-[var(--text-primary)]">
              Curriculum Articles
            </h2>
            <div className="flex items-center gap-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-surface)] p-0.5">
              <Link
                href={`/topic/${topic.slug}?sort=desc`}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sortOrder === "desc"
                    ? "bg-[var(--accent)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Newest
              </Link>
              <Link
                href={`/topic/${topic.slug}?sort=asc`}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sortOrder === "asc"
                    ? "bg-[var(--accent)] text-white font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Oldest
              </Link>
            </div>
          </div>

          <LatestBlogsList initialBlogs={blogs} initialCursor={nextCursor} />
        </section>
      </div>
    </div>
  );
}
