"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { adminDb } from "../firebase/admin";
import { verifyAdminSession, SESSION_COOKIE_NAME } from "../firebase/session";
import { BlogFormSchema } from "../zod-schemas";
import { rebuildTopicTreeMeta } from "./topics";
import { cleanPreviewText } from "../text-utils";
import type { Blog, Block, Topic } from "@/types";

/**
 * Ensures caller is an authenticated admin before executing an action
 */
async function assertAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const verification = await verifyAdminSession(sessionCookie);

  if (!verification.isValid || !verification.isAdmin) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
}

/**
 * Validates a 6-character subtopic ID and returns its resolved ancestor path and names
 */
export async function resolveSubtopicPath(subtopicId: string): Promise<{
  isValid: boolean;
  topicPath: string[];
  displayPath: string;
  subtopicName?: string;
  error?: string;
}> {
  try {
    const trimmed = subtopicId.trim();
    if (!trimmed || trimmed.length !== 6) {
      return { isValid: false, topicPath: [], displayPath: "", error: "Must be a 6-character ID." };
    }

    const doc = await adminDb.collection("topics").doc(trimmed).get();
    if (!doc.exists) {
      return { isValid: false, topicPath: [], displayPath: "", error: "No subtopic found with this ID." };
    }

    const subtopic = doc.data() as Topic;
    const fullPathIds = [...(subtopic.ancestors || []), trimmed];

    // Fetch ancestor names to create human-readable path
    const names: string[] = [];
    for (const id of fullPathIds) {
      const aDoc = await adminDb.collection("topics").doc(id).get();
      if (aDoc.exists) {
        names.push((aDoc.data() as Topic).name);
      } else {
        names.push(id);
      }
    }

    return {
      isValid: true,
      topicPath: fullPathIds,
      displayPath: names.join(" > "),
      subtopicName: subtopic.name,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error resolving path";
    return { isValid: false, topicPath: [], displayPath: "", error: message };
  }
}

/**
 * Calculate reading time in minutes based on words in blocks
 */
function calculateReadingTime(blocks: Block[]): number {
  let wordCount = 0;
  for (const block of blocks) {
    if (block.type === "paragraph" || block.type === "subtitle") {
      wordCount += block.text.split(/\s+/).filter(Boolean).length;
    } else if (block.type === "bullet_list" || block.type === "numbered_list") {
      wordCount += block.items.join(" ").split(/\s+/).filter(Boolean).length;
    } else if (block.type === "table") {
      wordCount += block.rows.flat().join(" ").split(/\s+/).filter(Boolean).length;
    } else if (block.type === "callout") {
      wordCount += block.text.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Extract an excerpt from the first paragraph or block
 */
function extractExcerpt(blocks: Block[]): string {
  for (const block of blocks) {
    if (block.type === "paragraph" && block.text.trim()) {
      const cleaned = cleanPreviewText(block.text);
      if (cleaned) {
        return cleaned.slice(0, 180).trim() + (cleaned.length > 180 ? "..." : "");
      }
    }
  }
  return "";
}

/**
 * Extract searchable lowercase keywords from title, blocks, and tags
 */
function extractKeywords(title: string, tags: string[], blocks: Block[]): string[] {
  const set = new Set<string>();
  title.toLowerCase().split(/\W+/).filter((w) => w.length > 2).forEach((w) => set.add(w));
  tags.forEach((t) => set.add(t.toLowerCase().trim()));

  for (const b of blocks.slice(0, 5)) {
    if ("text" in b && typeof b.text === "string") {
      b.text.toLowerCase().split(/\W+/).filter((w) => w.length > 3).forEach((w) => set.add(w));
    }
  }
  return Array.from(set).slice(0, 50);
}

/**
 * Save blog (draft or published)
 */
export async function saveBlog(formData: unknown): Promise<{ success: boolean; blogId: string; slug: string }> {
  await assertAdmin();

  const parsed = BlogFormSchema.parse(formData);
  const pathResolution = await resolveSubtopicPath(parsed.subtopicId);
  if (!pathResolution.isValid) {
    throw new Error(`Invalid subtopic ID: ${pathResolution.error}`);
  }

  const readingTime = calculateReadingTime(parsed.blocks as Block[]);
  const rawExcerpt = parsed.excerpt || extractExcerpt(parsed.blocks as Block[]);
  const excerpt = cleanPreviewText(rawExcerpt);
  const keywords = extractKeywords(parsed.title, parsed.tags, parsed.blocks as Block[]);

  const now = new Date().toISOString();
  let blogId = parsed.id;
  let isNew = false;

  // Check slug uniqueness
  const slugQuery = await adminDb
    .collection("blogs")
    .where("slug", "==", parsed.slug)
    .get();

  for (const doc of slugQuery.docs) {
    if (!blogId || doc.id !== blogId) {
      throw new Error("A blog with this slug already exists. Please choose a unique slug.");
    }
  }

  let publishedAt: string | undefined = undefined;

  if (blogId) {
    const existingDoc = await adminDb.collection("blogs").doc(blogId).get();
    if (existingDoc.exists) {
      const existingData = existingDoc.data() as Blog;
      publishedAt = existingData.publishedAt;
    }
  } else {
    isNew = true;
    const newDocRef = adminDb.collection("blogs").doc();
    blogId = newDocRef.id;
  }

  if (parsed.status === "published" && !publishedAt) {
    publishedAt = now;
  }

  // Check document size estimate. If blocks array is very large (> 700KB), split to subcollection
  const blocksJson = JSON.stringify(parsed.blocks);
  const isLarge = blocksJson.length > 700000;

  const blogData: Blog = {
    id: blogId,
    title: parsed.title.trim(),
    slug: parsed.slug.trim(),
    subtopicId: parsed.subtopicId.trim(),
    topicPath: pathResolution.topicPath,
    blocks: isLarge ? [] : (parsed.blocks as Block[]),
    references: parsed.references || [],
    acknowledgement: parsed.acknowledgement || undefined,
    status: parsed.status,
    keywords,
    excerpt,
    readingTime,
    tags: parsed.tags || [],
    createdAt: isNew ? now : undefined as unknown as string,
    updatedAt: now,
    publishedAt,
  };

  // Remove undefined fields for Firestore
  const sanitizedData = Object.fromEntries(
    Object.entries(blogData).filter(([_, v]) => v !== undefined)
  );

  await adminDb.collection("blogs").doc(blogId).set(sanitizedData, { merge: true });

  // If large, write blocks to subcollection
  if (isLarge) {
    const batch = adminDb.batch();
    const blocksRef = adminDb.collection("blogs").doc(blogId).collection("blocks");
    parsed.blocks.forEach((block, idx) => {
      const bRef = blocksRef.doc(`block_${String(idx).padStart(4, "0")}`);
      batch.set(bRef, { ...block, order: idx });
    });
    await batch.commit();
  }

  // Update blogCount in topics if published status changed
  await updateTopicBlogCounts(pathResolution.topicPath);

  // Invalidate Next.js cache tags and paths
  revalidateTag("latest", "max");
  revalidateTag("tree", "max");
  revalidateTag(`blog:${parsed.slug}`, "max");
  pathResolution.topicPath.forEach((tid) => revalidateTag(`topic:${tid}`, "max"));
  revalidatePath("/", "layout");
  revalidatePath("/admin/blogs");

  return { success: true, blogId, slug: parsed.slug };
}

/**
 * Helper to update blog counts on topics in the hierarchy
 */
async function updateTopicBlogCounts(topicPath: string[]): Promise<void> {
  try {
    for (const tid of topicPath) {
      const countSnap = await adminDb
        .collection("blogs")
        .where("topicPath", "array-contains", tid)
        .where("status", "==", "published")
        .count()
        .get();

      await adminDb.collection("topics").doc(tid).update({
        blogCount: countSnap.data().count,
        updatedAt: new Date().toISOString(),
      });
    }
    await rebuildTopicTreeMeta();
  } catch {
    // Non-critical background count sync
  }
}

/**
 * Toggle published/draft status of a blog
 */
export async function toggleBlogStatus(
  blogId: string,
  newStatus: "draft" | "published"
): Promise<void> {
  await assertAdmin();

  const doc = await adminDb.collection("blogs").doc(blogId).get();
  if (!doc.exists) {
    throw new Error("Blog not found.");
  }

  const data = doc.data() as Blog;
  const now = new Date().toISOString();
  const updates: Partial<Blog> = {
    status: newStatus,
    updatedAt: now,
  };

  if (newStatus === "published" && !data.publishedAt) {
    updates.publishedAt = now;
  }

  await adminDb.collection("blogs").doc(blogId).update(updates);

  if (data.topicPath) {
    await updateTopicBlogCounts(data.topicPath);
  }

  revalidateTag("latest", "max");
  revalidateTag("tree", "max");
  revalidateTag(`blog:${data.slug}`, "max");
  data.topicPath?.forEach((tid) => revalidateTag(`topic:${tid}`, "max"));
  revalidatePath("/", "layout");
  revalidatePath("/admin/blogs");
}

/**
 * Duplicate an existing blog as a new draft
 */
export async function duplicateBlog(blogId: string): Promise<string> {
  await assertAdmin();

  const doc = await adminDb.collection("blogs").doc(blogId).get();
  if (!doc.exists) {
    throw new Error("Source blog not found.");
  }

  const original = doc.data() as Blog;
  const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const newDocRef = adminDb.collection("blogs").doc();
  const duplicated: Blog = {
    ...original,
    id: newDocRef.id,
    title: `${original.title} (Copy)`,
    slug: newSlug,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
  };

  const sanitized = Object.fromEntries(
    Object.entries(duplicated).filter(([_, v]) => v !== undefined)
  );

  await newDocRef.set(sanitized);

  revalidatePath("/admin/blogs");
  return newDocRef.id;
}

/**
 * Delete a blog
 */
export async function deleteBlog(blogId: string): Promise<void> {
  await assertAdmin();

  const doc = await adminDb.collection("blogs").doc(blogId).get();
  if (!doc.exists) {
    return;
  }

  const data = doc.data() as Blog;
  await adminDb.collection("blogs").doc(blogId).delete();

  if (data.topicPath) {
    await updateTopicBlogCounts(data.topicPath);
  }

  revalidateTag("latest", "max");
  revalidateTag("tree", "max");
  revalidateTag(`blog:${data.slug}`, "max");
  data.topicPath?.forEach((tid) => revalidateTag(`topic:${tid}`, "max"));
  revalidatePath("/", "layout");
  revalidatePath("/admin/blogs");
}
