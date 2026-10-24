import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { Blog } from "@/types";
import { FolderTree, FileText, FileEdit, Plus, ArrowRight, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let topicsCount = 0;
  let publishedCount = 0;
  let draftsCount = 0;
  let recentEdits: Blog[] = [];

  try {
    const [topicsSnap, publishedSnap, draftsSnap, recentSnap] = await Promise.all([
      adminDb.collection("topics").count().get(),
      adminDb.collection("blogs").where("status", "==", "published").count().get(),
      adminDb.collection("blogs").where("status", "==", "draft").count().get(),
      adminDb.collection("blogs").orderBy("updatedAt", "desc").limit(8).get(),
    ]);

    topicsCount = topicsSnap.data().count;
    publishedCount = publishedSnap.data().count;
    draftsCount = draftsSnap.data().count;
    recentEdits = recentSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Blog));
  } catch {
    // If DB empty or offline
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Administration Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Overview of curriculum hierarchy, publication counts, and recent changes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/topics"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Manage Topics</span>
          </Link>
          <Link
            href="/admin/blogs/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write Article</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            <span>Curriculum Topics</span>
            <FolderTree className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-black text-[var(--text-primary)]">{topicsCount}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Includes main topics and nested subtopics
          </div>
        </div>

        <div className="p-5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            <span>Published Articles</span>
            <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-3xl font-black text-[var(--text-primary)]">{publishedCount}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Live and accessible to public readers
          </div>
        </div>

        <div className="p-5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            <span>Draft Articles</span>
            <FileEdit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-black text-[var(--text-primary)]">{draftsCount}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            Unpublished working drafts
          </div>
        </div>
      </div>

      {/* Recent Edits Table */}
      <div className="border border-[var(--border-color)] rounded bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Recent Publications & Edits
          </h2>
          <Link
            href="/admin/blogs"
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <span>View all blogs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentEdits.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            No articles recorded yet. Start by creating a topic and writing your first article.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] font-semibold text-[var(--text-secondary)]">
                  <th className="p-3">Title</th>
                  <th className="p-3">Subtopic ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {recentEdits.map((blog) => (
                  <tr key={blog.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="p-3 font-medium text-[var(--text-primary)] max-w-xs truncate">
                      {blog.title}
                    </td>
                    <td className="p-3 font-mono text-[var(--text-secondary)]">
                      {blog.subtopicId}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          blog.status === "published"
                            ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
                            : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">
                      {new Date(blog.updatedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {blog.status === "published" && (
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            title="View live article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blogs/${blog.id}`}
                          className="px-2 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)] text-[var(--text-primary)]"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
