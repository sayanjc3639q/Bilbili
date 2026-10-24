import Link from "next/link";
import { getCachedTopicTree, getLatestPublishedBlogs } from "@/lib/queries";
import { TopicSidebar } from "@/components/topic-sidebar";
import { LatestBlogsList } from "@/components/latest-blogs-list";
import { Folder, ArrowRight } from "lucide-react";

export const revalidate = 3600; // 1-hour ISR or on-demand revalidation

export default async function HomePage() {
  const [tree, { blogs, nextCursor }] = await Promise.all([
    getCachedTopicTree(),
    getLatestPublishedBlogs(10),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
      {/* Sidebar / Mobile Drawer */}
      <TopicSidebar tree={tree} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Hero Section */}
        <div className="pb-8 border-b border-[var(--border-color)] mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] mb-3">
            Bilbili Educational Archive
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            A structured, distraction-free educational library. Clear explanations, rigorous notes, and structured curricula across technical disciplines.
          </p>
        </div>

        {/* Main Topics as Simple Cards */}
        <section className="mb-12" aria-labelledby="main-topics-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="main-topics-heading" className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Folder className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Core Fields</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tree.map((topic) => (
              <div
                key={topic.id}
                className="p-5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      <Link href={`/topic/${topic.slug || topic.id}`}>
                        {topic.name}
                      </Link>
                    </h3>
                    {topic.blogCount > 0 && (
                      <span className="text-xs px-2 py-0.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] font-mono text-[var(--text-secondary)]">
                        {topic.blogCount} {topic.blogCount === 1 ? "article" : "articles"}
                      </span>
                    )}
                  </div>

                  {topic.children && topic.children.length > 0 && (
                    <div className="text-xs text-[var(--text-secondary)] space-y-1 mb-4">
                      <div className="font-medium text-[var(--text-primary)]">Subtopics:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {topic.children.slice(0, 4).map((c) => (
                          <Link
                            key={c.id}
                            href={`/topic/${c.slug || c.id}`}
                            className="px-2 py-0.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            {c.name}
                          </Link>
                        ))}
                        {topic.children.length > 4 && (
                          <span className="px-1.5 py-0.5 text-[var(--text-secondary)]">
                            +{topic.children.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/topic/${topic.slug || topic.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline mt-2"
                >
                  <span>Explore topic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Blogs */}
        <section aria-labelledby="latest-articles-heading">
          <div className="pb-3 border-b border-[var(--border-color)] mb-6 flex items-center justify-between">
            <h2 id="latest-articles-heading" className="text-lg font-bold text-[var(--text-primary)]">
              Latest Publications
            </h2>
          </div>

          <LatestBlogsList initialBlogs={blogs} initialCursor={nextCursor} />
        </section>
      </div>
    </div>
  );
}
