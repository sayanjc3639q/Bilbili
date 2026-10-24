"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  Copy,
  Trash2,
  Edit,
  Eye,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toggleBlogStatus, duplicateBlog, deleteBlog } from "@/lib/actions/blogs";
import type { Blog, TopicNode } from "@/types";

interface BlogsManagerProps {
  initialBlogs: Blog[];
  tree: TopicNode[];
}

export function BlogsManager({ initialBlogs, tree }: BlogsManagerProps) {
  const router = useRouter();

  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Flatten topics for the topic filter dropdown
  const topicOptions: { id: string; name: string }[] = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    function collect(nodes: TopicNode[]) {
      for (const n of nodes) {
        list.push({ id: n.id, name: n.name });
        if (n.children) collect(n.children);
      }
    }
    collect(tree);
    return list;
  }, [tree]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (topicFilter !== "all" && !b.topicPath?.includes(topicFilter)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesSlug = b.slug.toLowerCase().includes(q);
        const matchesId = b.subtopicId.toLowerCase().includes(q);
        return matchesTitle || matchesSlug || matchesId;
      }
      return true;
    });
  }, [blogs, statusFilter, topicFilter, searchQuery]);

  const handleToggleStatus = async (blog: Blog) => {
    const nextStatus = blog.status === "published" ? "draft" : "published";
    setLoadingId(blog.id);
    setMessage(null);
    try {
      await toggleBlogStatus(blog.id, nextStatus);
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: nextStatus } : b))
      );
      setMessage({ type: "success", text: `Blog status updated to ${nextStatus}.` });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to toggle status",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDuplicate = async (blogId: string) => {
    setLoadingId(blogId);
    setMessage(null);
    try {
      const newId = await duplicateBlog(blogId);
      setMessage({ type: "success", text: "Article duplicated as new draft." });
      router.push(`/admin/blogs/${newId}`);
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to duplicate blog",
      });
      setLoadingId(null);
    }
  };

  const handleDelete = async (blogId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    setLoadingId(blogId);
    setMessage(null);
    try {
      await deleteBlog(blogId);
      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
      setMessage({ type: "success", text: `Article "${title}" deleted.` });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete blog",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Articles Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Search, filter, edit, duplicate, and publish educational notes.
          </p>
        </div>

        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-800 dark:text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, or ID..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
            className="w-full h-9 px-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
          >
            <option value="all">All Statuses ({blogs.length})</option>
            <option value="published">
              Published Only ({blogs.filter((b) => b.status === "published").length})
            </option>
            <option value="draft">
              Drafts Only ({blogs.filter((b) => b.status === "draft").length})
            </option>
          </select>
        </div>

        {/* Topic filter */}
        <div className="flex items-center gap-2">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full h-9 px-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
          >
            <option value="all">All Topics</option>
            {topicOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[var(--border-color)] rounded bg-[var(--bg-surface)] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] font-semibold text-[var(--text-secondary)]">
              <th className="p-3">Title & Slug</th>
              <th className="p-3">Subtopic ID</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reading Time</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredBlogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)]">
                  No articles matched your criteria.
                </td>
              </tr>
            ) : (
              filteredBlogs.map((blog) => {
                const isLoading = loadingId === blog.id;
                return (
                  <tr key={blog.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="p-3 min-w-[200px] max-w-sm">
                      <div className="font-semibold text-sm text-[var(--text-primary)] line-clamp-1">
                        {blog.title}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate">
                        /blog/{blog.slug}
                      </div>
                    </td>

                    <td className="p-3 font-mono font-medium text-[var(--text-primary)]">
                      <span className="px-2 py-0.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)]">
                        {blog.subtopicId}
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(blog)}
                        disabled={isLoading}
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border hover:opacity-80 transition-opacity ${
                          blog.status === "published"
                            ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
                            : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                        }`}
                        title="Click to toggle status"
                      >
                        {blog.status}
                      </button>
                    </td>

                    <td className="p-3 text-[var(--text-secondary)]">
                      {blog.readingTime} min
                    </td>

                    <td className="p-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(blog.updatedAt).toLocaleDateString()}
                    </td>

                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {blog.status === "published" && (
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
                            title="View published article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <Link
                          href={`/admin/blogs/${blog.id}`}
                          className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
                          title="Edit article"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(blog.id)}
                          disabled={isLoading}
                          className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
                          title="Duplicate as new draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(blog.id, blog.title)}
                          disabled={isLoading}
                          className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-red-600 hover:border-red-500"
                          title="Delete article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
