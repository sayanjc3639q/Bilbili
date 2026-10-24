"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Move,
  Trash2,
  Copy,
  Check,
  FolderPlus,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  createMainTopic,
  createSubtopic,
  renameTopic,
  moveTopic,
  deleteTopic,
} from "@/lib/actions/topics";
import type { TopicNode } from "@/types";

interface TopicsManagerProps {
  initialTree: TopicNode[];
}

export function TopicsManager({ initialTree }: TopicsManagerProps) {
  const [tree, setTree] = useState<TopicNode[]>(initialTree);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal states
  const [mainTopicModal, setMainTopicModal] = useState(false);
  const [subtopicModal, setSubtopicModal] = useState<{ open: boolean; parentId: string; parentName: string }>({
    open: false,
    parentId: "",
    parentName: "",
  });
  const [renameModal, setRenameModal] = useState<{ open: boolean; topicId: string; currentName: string }>({
    open: false,
    topicId: "",
    currentName: "",
  });
  const [moveModal, setMoveModal] = useState<{ open: boolean; topicId: string; currentParentId: string | null; topicName: string }>({
    open: false,
    topicId: "",
    currentParentId: null,
    topicName: "",
  });

  // Form field states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [targetParentId, setTargetParentId] = useState<string | null>(null);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore
    }
  };

  const handleSlugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // 1. Create Main Topic
  const handleCreateMainTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createMainTopic(formName, formSlug || handleSlugify(formName));
      setSuccess(`Main topic "${formName}" created successfully.`);
      setMainTopicModal(false);
      setFormName("");
      setFormSlug("");
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create main topic");
    } finally {
      setLoading(false);
    }
  };

  // 2. Create Subtopic
  const handleCreateSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await createSubtopic(
        formName,
        formSlug || handleSlugify(formName),
        subtopicModal.parentId
      );
      setSuccess(`Subtopic "${formName}" created with 6-char ID: ${created.id}`);
      setSubtopicModal({ open: false, parentId: "", parentName: "" });
      setFormName("");
      setFormSlug("");
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create subtopic");
    } finally {
      setLoading(false);
    }
  };

  // 3. Rename Topic
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await renameTopic(renameModal.topicId, formName);
      setSuccess(`Topic renamed to "${formName}".`);
      setRenameModal({ open: false, topicId: "", currentName: "" });
      setFormName("");
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rename topic");
    } finally {
      setLoading(false);
    }
  };

  // 4. Move Topic
  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await moveTopic(moveModal.topicId, targetParentId);
      setSuccess(`Topic moved successfully.`);
      setMoveModal({ open: false, topicId: "", currentParentId: null, topicName: "" });
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to move topic");
    } finally {
      setLoading(false);
    }
  };

  // 5. Delete Topic
  const handleDelete = async (topicId: string, topicName: string) => {
    if (!confirm(`Are you sure you want to delete topic "${topicName}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await deleteTopic(topicId);
      setSuccess(`Topic "${topicName}" deleted.`);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete topic");
    } finally {
      setLoading(false);
    }
  };

  // Flatten tree for Move target options
  const flattenOptions: { id: string; name: string; level: number }[] = [];
  function collectOptions(nodes: TopicNode[]) {
    for (const n of nodes) {
      flattenOptions.push({ id: n.id, name: n.name, level: n.level });
      if (n.children) collectOptions(n.children);
    }
  }
  collectOptions(tree);

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Curriculum Topics Manager
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Unlimited depth topic hierarchy. Every subtopic receives a guaranteed unique 6-character ID for blog linking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormName("");
            setFormSlug("");
            setMainTopicModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Main Topic</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 rounded text-red-800 dark:text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 border border-green-300 dark:border-green-900 bg-green-50 dark:bg-green-950/40 rounded text-green-800 dark:text-green-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Interactive Tree View */}
      <div className="border border-[var(--border-color)] rounded bg-[var(--bg-surface)] p-4 sm:p-6 overflow-x-auto">
        {tree.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
            No topics exist yet. Click &quot;New Main Topic&quot; to initialize your curriculum.
          </div>
        ) : (
          <ul className="space-y-2">
            {tree.map((node) => (
              <TopicTreeItem
                key={node.id}
                node={node}
                copiedId={copiedId}
                onCopyId={copyId}
                onAddSubtopic={(parentId, parentName) => {
                  setFormName("");
                  setFormSlug("");
                  setSubtopicModal({ open: true, parentId, parentName });
                }}
                onRename={(topicId, currentName) => {
                  setFormName(currentName);
                  setRenameModal({ open: true, topicId, currentName });
                }}
                onMove={(topicId, currentParentId, topicName) => {
                  setTargetParentId(currentParentId);
                  setMoveModal({ open: true, topicId, currentParentId, topicName });
                }}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Modal: Create Main Topic */}
      {mounted && mainTopicModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-md my-auto bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Create Main Topic</h3>
              <button type="button" onClick={() => setMainTopicModal(false)}>
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleCreateMainTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formSlug) setFormSlug(handleSlugify(e.target.value));
                  }}
                  placeholder="e.g. Electrical Engineering"
                  className="w-full h-9 px-3 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(handleSlugify(e.target.value))}
                  placeholder="electrical-engineering"
                  className="w-full h-9 px-3 text-sm font-mono bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMainTopicModal(false)}
                  className="px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Subtopic */}
      {mounted && subtopicModal.open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-md my-auto bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Add Subtopic</h3>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Parent: {subtopicModal.parentName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubtopicModal({ open: false, parentId: "", parentName: "" })}
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleCreateSubtopic} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Subtopic Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!formSlug) setFormSlug(handleSlugify(e.target.value));
                  }}
                  placeholder="e.g. Electric Field Theory"
                  className="w-full h-9 px-3 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(handleSlugify(e.target.value))}
                  placeholder="electric-field-theory"
                  className="w-full h-9 px-3 text-sm font-mono bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                A collision-free 6-character private ID will be generated automatically in a transaction.
              </p>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSubtopicModal({ open: false, parentId: "", parentName: "" })}
                  className="px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Generating ID..." : "Add Subtopic"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Rename Topic */}
      {mounted && renameModal.open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-md my-auto bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Rename Topic</h3>
              <button
                type="button"
                onClick={() => setRenameModal({ open: false, topicId: "", currentName: "" })}
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleRename} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  New Topic Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRenameModal({ open: false, topicId: "", currentName: "" })}
                  className="px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Move Topic */}
      {mounted && moveModal.open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-md my-auto bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-6 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Move Topic</h3>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{moveModal.topicName}</div>
              </div>
              <button
                type="button"
                onClick={() => setMoveModal({ open: false, topicId: "", currentParentId: null, topicName: "" })}
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
            <form onSubmit={handleMove} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Select New Parent Topic
                </label>
                <select
                  value={targetParentId || ""}
                  onChange={(e) => setTargetParentId(e.target.value || null)}
                  className="w-full h-10 px-3 text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                >
                  <option value="">(Make Main Topic - Root Level 0)</option>
                  {flattenOptions
                    .filter((opt) => opt.id !== moveModal.topicId)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {"—".repeat(opt.level)} {opt.name} ({opt.id})
                      </option>
                    ))}
                </select>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Moving updates ancestor arrays for all descendants and the topicPath of all affected blogs in batch chunks under 500.
              </p>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMoveModal({ open: false, topicId: "", currentParentId: null, topicName: "" })}
                  className="px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Re-parenting..." : "Move Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function TopicTreeItem({
  node,
  copiedId,
  onCopyId,
  onAddSubtopic,
  onRename,
  onMove,
  onDelete,
}: {
  node: TopicNode;
  copiedId: string | null;
  onCopyId: (id: string) => void;
  onAddSubtopic: (parentId: string, parentName: string) => void;
  onRename: (topicId: string, currentName: string) => void;
  onMove: (topicId: string, currentParentId: string | null, topicName: string) => void;
  onDelete: (topicId: string, topicName: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSubtopic = node.level > 0;

  return (
    <li className="border-l-2 border-[var(--border-color)] pl-3 my-1 text-sm">
      <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)] group hover:border-[var(--accent)] transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 -ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-3.5" />
          )}

          <span className="font-semibold text-[var(--text-primary)] truncate">
            {node.name}
          </span>

          <span className="text-[11px] font-mono px-1.5 py-0.2 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
            L{node.level}
          </span>

          {/* 6-character private ID with one-click copy button */}
          {isSubtopic && (
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-color)] font-mono text-xs">
              <span className="text-[var(--text-secondary)]">ID:</span>
              <span className="font-bold text-[var(--text-primary)]">{node.id}</span>
              <button
                type="button"
                onClick={() => onCopyId(node.id)}
                className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent)] ml-0.5"
                title="Copy 6-character ID for blog pasting"
                aria-label={`Copy ID ${node.id}`}
              >
                {copiedId === node.id ? (
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {node.blogCount > 0 && (
            <span className="text-xs text-[var(--text-secondary)]">
              ({node.blogCount} blogs)
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => onAddSubtopic(node.id, node.name)}
            className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
            title="Add subtopic under this node"
            aria-label="Add subtopic"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onRename(node.id, node.name)}
            className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
            title="Rename topic"
            aria-label="Rename topic"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onMove(node.id, node.parentId, node.name)}
            className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]"
            title="Move topic under new parent"
            aria-label="Move topic"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(node.id, node.name)}
            className="p-1.5 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-red-600 hover:border-red-500"
            title="Delete topic (only if empty)"
            aria-label="Delete topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="space-y-1 mt-1 pl-2">
          {node.children.map((child) => (
            <TopicTreeItem
              key={child.id}
              node={child}
              copiedId={copiedId}
              onCopyId={onCopyId}
              onAddSubtopic={onAddSubtopic}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
