"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Loader2,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  List,
  ListOrdered,
  Type,
  FileText,
  AlertTriangle,
  Calculator,
  ExternalLink,
} from "lucide-react";
import { saveBlog, resolveSubtopicPath } from "@/lib/actions/blogs";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import type { Blog, Block, ReferenceItem } from "@/types";

interface BlogEditorProps {
  initialBlog?: Blog;
}

export function BlogEditor({ initialBlog }: BlogEditorProps) {
  const router = useRouter();

  // Form states
  const [id, setId] = useState(initialBlog?.id || "");
  const [title, setTitle] = useState(initialBlog?.title || "");
  const [slug, setSlug] = useState(initialBlog?.slug || "");
  const [slugCustomized, setSlugCustomized] = useState(Boolean(initialBlog?.slug));
  const [subtopicId, setSubtopicId] = useState(initialBlog?.subtopicId || "");
  const [resolvedPath, setResolvedPath] = useState<string>("");
  const [pathValid, setPathValid] = useState<boolean>(false);
  const [validatingPath, setValidatingPath] = useState(false);

  const [blocks, setBlocks] = useState<Block[]>(
    initialBlog?.blocks && initialBlog.blocks.length > 0
      ? initialBlog.blocks
      : [
          {
            id: `p_${Date.now()}`,
            type: "paragraph",
            text: "Start writing your educational article content here...",
          },
        ]
  );

  const [references, setReferences] = useState<ReferenceItem[]>(
    initialBlog?.references || []
  );
  const [acknowledgement, setAcknowledgement] = useState(
    initialBlog?.acknowledgement || ""
  );
  const [tagsInput, setTagsInput] = useState(
    (initialBlog?.tags || []).join(", ")
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initialBlog?.status || "draft"
  );

  // UI states
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastAutosave, setLastAutosave] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-slug generator
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    if (!slugCustomized) {
      setSlug(slugify(val));
    }
  };

  // Instant subtopic ID validation
  useEffect(() => {
    const trimmed = subtopicId.trim();
    if (trimmed.length !== 6) {
      setResolvedPath("");
      setPathValid(false);
      return;
    }

    let isCancelled = false;
    setValidatingPath(true);

    const timer = setTimeout(async () => {
      try {
        const res = await resolveSubtopicPath(trimmed);
        if (!isCancelled) {
          if (res.isValid) {
            setResolvedPath(res.displayPath);
            setPathValid(true);
          } else {
            setResolvedPath(res.error || "Subtopic ID not found");
            setPathValid(false);
          }
        }
      } catch {
        if (!isCancelled) {
          setResolvedPath("Validation failed");
          setPathValid(false);
        }
      } finally {
        if (!isCancelled) setValidatingPath(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [subtopicId]);

  // Autosave to localStorage
  const autosaveKey = `bilbili_draft_autosave_${id || "new"}`;

  const triggerAutosave = useCallback(() => {
    if (!title && blocks.length === 0) return;
    try {
      const dataToSave = {
        id,
        title,
        slug,
        subtopicId,
        blocks,
        references,
        acknowledgement,
        tagsInput,
        status,
        timestamp: new Date().toLocaleTimeString(),
      };
      localStorage.setItem(autosaveKey, JSON.stringify(dataToSave));
      setLastAutosave(new Date().toLocaleTimeString());
    } catch {
      // LocalStorage quota
    }
  }, [autosaveKey, id, title, slug, subtopicId, blocks, references, acknowledgement, tagsInput, status]);

  // Periodic autosave interval
  useEffect(() => {
    if (!isDirty) return;
    const interval = setInterval(triggerAutosave, 15000); // every 15s
    return () => clearInterval(interval);
  }, [isDirty, triggerAutosave]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Add block helper
  const addBlock = (type: Block["type"]) => {
    const newId = `b_${Date.now()}`;
    let newBlock: Block;

    switch (type) {
      case "subtitle":
        newBlock = { id: newId, type: "subtitle", text: "New Section Subtitle" };
        break;
      case "paragraph":
        newBlock = { id: newId, type: "paragraph", text: "" };
        break;
      case "bullet_list":
        newBlock = { id: newId, type: "bullet_list", items: ["First item"] };
        break;
      case "numbered_list":
        newBlock = { id: newId, type: "numbered_list", items: ["First numbered step"] };
        break;
      case "table":
        newBlock = {
          id: newId,
          type: "table",
          hasHeader: true,
          rows: [
            ["Header 1", "Header 2", "Header 3"],
            ["Data 1", "Data 2", "Data 3"],
          ],
        };
        break;
      case "image":
        newBlock = {
          id: newId,
          type: "image",
          url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop",
          alt: "Technical diagram illustration",
          caption: "Figure 1: Illustration",
        };
        break;
      case "code":
        newBlock = {
          id: newId,
          type: "code",
          language: "typescript",
          code: "// Add code snippet here\nconst speedOfLight = 299792458;\nconsole.log(speedOfLight);",
          filename: "example.ts",
        };
        break;
      case "callout":
        newBlock = {
          id: newId,
          type: "callout",
          kind: "note",
          title: "Important Note",
          text: "Highlight key foundational theorem or cautionary guidance here.",
        };
        break;
      case "equation":
        newBlock = {
          id: newId,
          type: "equation",
          formula: "E = mc^2 \\quad \\text{and} \\quad \\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}",
          isBlock: true,
        };
        break;
      default:
        return;
    }

    setBlocks((prev) => [...prev, newBlock]);
    setIsDirty(true);
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === blocks.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const nextBlocks = [...blocks];
    const temp = nextBlocks[index];
    nextBlocks[index] = nextBlocks[targetIndex];
    nextBlocks[targetIndex] = temp;
    setBlocks(nextBlocks);
    setIsDirty(true);
  };

  const updateBlock = (index: number, updated: Block) => {
    setBlocks((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
    setIsDirty(true);
  };

  // Image client-side compression
  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to WebP with 0.8 quality (keeps file < 150KB)
        const compressedDataUrl = canvas.toDataURL("image/webp", 0.8);
        const currentBlock = blocks[index] as Extract<Block, { type: "image" }>;
        updateBlock(index, {
          ...currentBlock,
          url: compressedDataUrl,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Save handler
  const handleSave = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Please enter an article title." });
      return;
    }
    if (!subtopicId.trim() || !pathValid) {
      setMessage({ type: "error", text: "Please provide a valid 6-character Subtopic ID." });
      return;
    }
    if (blocks.length === 0) {
      setMessage({ type: "error", text: "Please add at least one block of content." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      const payload = {
        id: id || undefined,
        title: title.trim(),
        slug: slug.trim(),
        subtopicId: subtopicId.trim(),
        blocks,
        references,
        acknowledgement: acknowledgement.trim() || undefined,
        status: targetStatus,
        tags,
      };

      const result = await saveBlog(payload);
      setIsDirty(false);
      setStatus(targetStatus);
      if (!id) setId(result.blogId);

      // Clean autosave
      localStorage.removeItem(autosaveKey);

      setMessage({
        type: "success",
        text: `Article successfully saved as ${targetStatus}.`,
      });

      if (!id) {
        router.push(`/admin/blogs/${result.blogId}`);
      }
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save article.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {id ? "Edit Article" : "New Curriculum Article"}
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                status === "published"
                  ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              }`}
            >
              {status}
            </span>
          </div>
          {lastAutosave && (
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Autosaved locally at {lastAutosave}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Live Preview */}
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
          >
            {previewMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Editor</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </>
            )}
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {isSaving && status === "draft" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Draft</span>
          </button>

          {/* Publish / Unpublish */}
          <button
            type="button"
            onClick={() => handleSave(status === "published" ? "draft" : "published")}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {isSaving && status === "published" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{status === "published" ? "Unpublish" : "Publish"}</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {message && (
        <div
          className={`p-3.5 rounded text-xs flex items-center gap-2 border ${
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

      {/* Main Content Area: Editor or Live Preview */}
      {previewMode ? (
        <div className="reading-column p-6 border border-[var(--border-color)] rounded bg-[var(--bg-main)]">
          <div className="text-xs uppercase font-mono text-[var(--text-secondary)] mb-2">
            PREVIEW: {resolvedPath || "Unassigned subtopic"}
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-color)]">
            {title || "Untitled Article"}
          </h1>
          <BlockRenderer blocks={blocks} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="p-4 sm:p-6 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Electric Current and Drift Velocity"
                  className="w-full h-10 px-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
                />
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugCustomized(true);
                    setIsDirty(true);
                  }}
                  placeholder="electric-current-and-drift-velocity"
                  className="w-full h-10 px-3 text-sm font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Subtopic ID & Instant Path Resolution */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Subtopic 6-Character ID *
                </label>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Paste the 6-character ID from the Topics Manager
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    maxLength={6}
                    value={subtopicId}
                    onChange={(e) => {
                      setSubtopicId(e.target.value.trim());
                      setIsDirty(true);
                    }}
                    placeholder="e.g. eeCE02"
                    className="w-full h-10 px-3 text-sm font-mono uppercase bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent)]"
                  />
                  {validatingPath && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-[var(--text-secondary)]" />
                  )}
                </div>

                {/* Resolved Breadcrumb Path Feedback */}
                <div className="flex-1">
                  {pathValid ? (
                    <div className="p-2 border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/40 rounded text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">Resolved Path:</span>
                      <span className="truncate">{resolvedPath}</span>
                    </div>
                  ) : subtopicId.length === 6 && !validatingPath ? (
                    <div className="p-2 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 rounded text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{resolvedPath || "Invalid 6-character ID. Please check Topics Manager."}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Enter the 6-character ID to resolve parent hierarchy.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="physics, electronics, electromagnetism"
                className="w-full h-9 px-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Block Editor Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Content Blocks ({blocks.length})
              </h2>
            </div>

            {/* Blocks List */}
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="p-4 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] space-y-3"
                >
                  {/* Block Header */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2 font-mono">
                    <span className="uppercase font-semibold text-[var(--text-primary)]">
                      Block {index + 1}: {block.type}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "up")}
                        disabled={index === 0}
                        className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveBlock(index, "down")}
                        disabled={index === blocks.length - 1}
                        className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:text-red-600 hover:border-red-500 ml-2"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Block Editors */}
                  {block.type === "subtitle" && (
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                      placeholder="Section Subtitle / Heading"
                      className="w-full h-9 px-3 text-base font-bold bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                    />
                  )}

                  {block.type === "paragraph" && (
                    <textarea
                      rows={4}
                      value={block.text}
                      onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                      placeholder="Write educational paragraph..."
                      className="w-full p-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] leading-relaxed resize-y"
                    />
                  )}

                  {(block.type === "bullet_list" || block.type === "numbered_list") && (
                    <div className="space-y-2">
                      {block.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-secondary)] w-5">
                            {block.type === "bullet_list" ? "•" : `${itemIdx + 1}.`}
                          </span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...block.items];
                              newItems[itemIdx] = e.target.value;
                              updateBlock(index, { ...block, items: newItems });
                            }}
                            className="flex-1 h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = block.items.filter((_, i) => i !== itemIdx);
                              updateBlock(index, { ...block, items: newItems });
                            }}
                            className="p-1 text-[var(--text-secondary)] hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateBlock(index, { ...block, items: [...block.items, "New item"] })
                        }
                        className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    </div>
                  )}

                  {block.type === "table" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={block.hasHeader}
                            onChange={(e) =>
                              updateBlock(index, { ...block, hasHeader: e.target.checked })
                            }
                          />
                          <span>First row is header</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const colCount = block.rows[0]?.length || 2;
                              const newRows = [...block.rows, new Array(colCount).fill("Cell")];
                              updateBlock(index, { ...block, rows: newRows });
                            }}
                            className="px-2 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)]"
                          >
                            + Add Row
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newRows = block.rows.map((r) => [...r, "Cell"]);
                              updateBlock(index, { ...block, rows: newRows });
                            }}
                            className="px-2 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] hover:border-[var(--accent)]"
                          >
                            + Add Column
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-[var(--border-color)] rounded bg-[var(--bg-main)] p-2">
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-1">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const newRows = block.rows.map((r, ri) =>
                                          ri === rIdx
                                            ? r.map((c, ci) => (ci === cIdx ? e.target.value : c))
                                            : r
                                        );
                                        updateBlock(index, { ...block, rows: newRows });
                                      }}
                                      className={`w-full h-7 px-2 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] text-[var(--text-primary)] ${
                                        rIdx === 0 && block.hasHeader ? "font-bold" : ""
                                      }`}
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {block.type === "image" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                            Image URL or Upload Compressed File
                          </label>
                          <input
                            type="text"
                            value={block.url}
                            onChange={(e) => updateBlock(index, { ...block, url: e.target.value })}
                            placeholder="https://..."
                            className="w-full h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] mb-2"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(index, file);
                            }}
                            className="text-xs text-[var(--text-secondary)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                            Alt Text (Required for Accessibility) *
                          </label>
                          <input
                            type="text"
                            required
                            value={block.alt}
                            onChange={(e) => updateBlock(index, { ...block, alt: e.target.value })}
                            placeholder="Descriptive explanation for screen readers"
                            className="w-full h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                          />

                          <label className="block text-xs font-semibold text-[var(--text-secondary)] mt-2 mb-1">
                            Caption (Optional)
                          </label>
                          <input
                            type="text"
                            value={block.caption || ""}
                            onChange={(e) =>
                              updateBlock(index, { ...block, caption: e.target.value })
                            }
                            placeholder="Figure label or diagram description"
                            className="w-full h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === "code" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Language
                          </label>
                          <input
                            type="text"
                            value={block.language}
                            onChange={(e) =>
                              updateBlock(index, { ...block, language: e.target.value })
                            }
                            placeholder="typescript, python, cpp, rust..."
                            className="w-full h-8 px-2.5 text-xs font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                            Filename (Optional)
                          </label>
                          <input
                            type="text"
                            value={block.filename || ""}
                            onChange={(e) =>
                              updateBlock(index, { ...block, filename: e.target.value })
                            }
                            placeholder="main.py"
                            className="w-full h-8 px-2.5 text-xs font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                          />
                        </div>
                      </div>

                      <textarea
                        rows={6}
                        value={block.code}
                        onChange={(e) => updateBlock(index, { ...block, code: e.target.value })}
                        placeholder="Paste code snippet..."
                        className="w-full p-3 text-xs font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] resize-y leading-relaxed"
                      />
                    </div>
                  )}

                  {block.type === "callout" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">
                          Kind:
                        </label>
                        <select
                          value={block.kind}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              kind: e.target.value as "note" | "warning",
                            })
                          }
                          className="h-8 px-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                        >
                          <option value="note">Note (Informational)</option>
                          <option value="warning">Warning (Cautionary)</option>
                        </select>

                        <input
                          type="text"
                          value={block.title || ""}
                          onChange={(e) =>
                            updateBlock(index, { ...block, title: e.target.value })
                          }
                          placeholder="Optional Callout Header"
                          className="flex-1 h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                        />
                      </div>

                      <textarea
                        rows={3}
                        value={block.text}
                        onChange={(e) => updateBlock(index, { ...block, text: e.target.value })}
                        placeholder="Callout text message..."
                        className="w-full p-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] resize-y"
                      />
                    </div>
                  )}

                  {block.type === "equation" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-[var(--text-secondary)]">
                          KaTeX LaTeX Formula
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)]">
                          <input
                            type="checkbox"
                            checked={block.isBlock}
                            onChange={(e) =>
                              updateBlock(index, { ...block, isBlock: e.target.checked })
                            }
                          />
                          <span>Display as centered block</span>
                        </label>
                      </div>

                      <textarea
                        rows={2}
                        value={block.formula}
                        onChange={(e) =>
                          updateBlock(index, { ...block, formula: e.target.value })
                        }
                        placeholder="\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
                        className="w-full p-2.5 text-xs font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] resize-y"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Block Palette */}
            <div className="p-4 border border-dashed border-[var(--border-color)] rounded bg-[var(--bg-surface)]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Insert New Block
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addBlock("subtitle")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Subtitle</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("paragraph")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paragraph</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("bullet_list")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Bullet List</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("numbered_list")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Numbered List</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("table")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("image")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("code")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("callout")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Callout</span>
                </button>

                <button
                  type="button"
                  onClick={() => addBlock("equation")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>KaTeX Math</span>
                </button>
              </div>
            </div>
          </div>

          {/* References Section */}
          <div className="p-4 sm:p-6 border border-[var(--border-color)] rounded bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                References & Citations
              </h2>
              <button
                type="button"
                onClick={() =>
                  setReferences([...references, { label: "Source Label", url: "https://" }])
                }
                className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Reference
              </button>
            </div>

            {references.map((ref, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={ref.label}
                  onChange={(e) => {
                    const copy = [...references];
                    copy[idx].label = e.target.value;
                    setReferences(copy);
                    setIsDirty(true);
                  }}
                  placeholder="Citation title or textbook reference"
                  className="flex-1 h-8 px-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
                <input
                  type="url"
                  value={ref.url}
                  onChange={(e) => {
                    const copy = [...references];
                    copy[idx].url = e.target.value;
                    setReferences(copy);
                    setIsDirty(true);
                  }}
                  placeholder="https://..."
                  className="flex-1 h-8 px-2.5 text-xs font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReferences(references.filter((_, i) => i !== idx));
                    setIsDirty(true);
                  }}
                  className="p-1 text-[var(--text-secondary)] hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Acknowledgement Section */}
          <div className="p-4 sm:p-6 border border-[var(--border-color)] rounded bg-[var(--bg-surface)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
              Acknowledgements (Optional)
            </h2>
            <textarea
              rows={2}
              value={acknowledgement}
              onChange={(e) => {
                setAcknowledgement(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Grateful to the MIT OpenCourseWare Physics department and peer reviewers."
              className="w-full p-2.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[var(--text-primary)] resize-y"
            />
          </div>
        </div>
      )}
    </div>
  );
}
