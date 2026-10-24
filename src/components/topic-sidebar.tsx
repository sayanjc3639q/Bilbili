"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, Folder, X, Menu } from "lucide-react";
import type { TopicNode } from "@/types";

interface TopicSidebarProps {
  tree: TopicNode[];
  activeTopicId?: string;
}

export function TopicSidebar({ tree, activeTopicId }: TopicSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] rounded hover:border-[var(--accent)] transition-colors"
          aria-expanded={mobileOpen}
          aria-label="Open topic directory"
        >
          <Menu className="w-4 h-4 text-[var(--text-secondary)]" />
          <span>Browse Topics</span>
        </button>
      </div>

      {/* Desktop Sidebar (260px) */}
      <aside
        className="hidden lg:block w-[260px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 border-r border-[var(--border-color)]"
        aria-label="Topic navigation"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5" />
          <span>Curriculum Topics</span>
        </div>
        <nav className="text-sm">
          <TopicTreeList
            nodes={tree}
            currentPath={pathname}
            activeTopicId={activeTopicId}
          />
        </nav>
      </aside>

      {/* Mobile Drawer Modal */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-none animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Topic directory"
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[var(--bg-main)] border-r border-[var(--border-color)] p-5 overflow-y-auto z-50 flex flex-col animate-slide-in-left shadow-none"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
              <span className="font-semibold text-[var(--text-primary)]">Topics Directory</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close topic drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 text-sm">
              <TopicTreeList
                nodes={tree}
                currentPath={pathname}
                activeTopicId={activeTopicId}
                onSelect={() => setMobileOpen(false)}
              />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function TopicTreeList({
  nodes,
  currentPath,
  activeTopicId,
  onSelect,
}: {
  nodes: TopicNode[];
  currentPath: string;
  activeTopicId?: string;
  onSelect?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <TopicTreeNode
          key={node.id}
          node={node}
          currentPath={currentPath}
          activeTopicId={activeTopicId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function TopicTreeNode({
  node,
  currentPath,
  activeTopicId,
  onSelect,
}: {
  node: TopicNode;
  currentPath: string;
  activeTopicId?: string;
  onSelect?: () => void;
}) {
  const nodeHref = `/topic/${node.slug || node.id}`;
  const isActive =
    currentPath === nodeHref ||
    activeTopicId === node.id ||
    activeTopicId === node.slug;

  const hasChildren = node.children && node.children.length > 0;
  
  // Check if any descendant is currently active to auto-expand
  const hasActiveDescendant = (n: TopicNode): boolean => {
    if (n.id === activeTopicId || n.slug === activeTopicId) return true;
    return n.children.some(hasActiveDescendant);
  };

  const isExpandedByDefault = isActive || (hasChildren && hasActiveDescendant(node));
  const [expanded, setExpanded] = useState(isExpandedByDefault);

  return (
    <li className="select-none">
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded transition-colors ${
          isActive
            ? "bg-[var(--border-color)] font-medium text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        }`}
      >
        <Link
          href={nodeHref}
          onClick={onSelect}
          className="flex-1 truncate hover:underline"
        >
          {node.name}
        </Link>

        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
            className="p-1 -mr-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          node.blogCount > 0 && (
            <span className="text-[11px] font-mono px-1.5 py-0.2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[var(--text-secondary)]">
              {node.blogCount}
            </span>
          )
        )}
      </div>

      {hasChildren && expanded && (
        <div className="pl-3.5 ml-1.5 border-l border-[var(--border-color)] mt-0.5 space-y-0.5">
          <TopicTreeList
            nodes={node.children}
            currentPath={currentPath}
            activeTopicId={activeTopicId}
            onSelect={onSelect}
          />
        </div>
      )}
    </li>
  );
}
