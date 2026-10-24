import { unstable_cache } from "next/cache";
import { adminDb } from "./firebase/admin";
import type { Blog, Topic, TopicNode, TopicTreeDoc } from "@/types";
import { cleanPreviewText } from "./text-utils";

function sanitizeBlog(blog: Blog): Blog {
  if (blog.excerpt) {
    blog.excerpt = cleanPreviewText(blog.excerpt);
  }
  return blog;
}

/**
 * Fallback topic tree used when Firestore meta document is being populated or during cold builds
 */
const DEFAULT_FALLBACK_TREE: TopicNode[] = [
  {
    id: "electrical-engineering",
    name: "Electrical Engineering",
    slug: "electrical-engineering",
    parentId: null,
    level: 0,
    ancestors: [],
    blogCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: "eeFT01",
        name: "Electric Field Theory",
        slug: "electric-field-theory",
        parentId: "electrical-engineering",
        level: 1,
        ancestors: ["electrical-engineering"],
        blogCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [
          {
            id: "eeCE02",
            name: "Current Electricity",
            slug: "current-electricity",
            parentId: "eeFT01",
            level: 2,
            ancestors: ["electrical-engineering", "eeFT01"],
            blogCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    slug: "computer-science",
    parentId: null,
    level: 0,
    ancestors: [],
    blogCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: "csDS01",
        name: "Data Structures",
        slug: "data-structures",
        parentId: "computer-science",
        level: 1,
        ancestors: ["computer-science"],
        blogCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
      {
        id: "csAL02",
        name: "Algorithms",
        slug: "algorithms",
        parentId: "computer-science",
        level: 1,
        ancestors: ["computer-science"],
        blogCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        children: [],
      },
    ],
  },
];

/**
 * Fetch the denormalized topic tree from meta/topicTree.
 * Cached with tag 'tree' so it only incurs 1 read until topics change.
 */
export const getCachedTopicTree = unstable_cache(
  async (): Promise<TopicNode[]> => {
    try {
      const doc = await adminDb.collection("meta").doc("topicTree").get();
      if (doc.exists) {
        const data = doc.data() as TopicTreeDoc;
        if (data.roots && data.roots.length > 0) {
          return data.roots;
        }
      }

      // If meta doc doesn't exist yet, reconstruct it from topics collection
      const topicsSnap = await adminDb.collection("topics").get();
      if (topicsSnap.empty) {
        return DEFAULT_FALLBACK_TREE;
      }

      const allTopics: Topic[] = [];
      topicsSnap.forEach((d) => allTopics.push({ id: d.id, ...d.data() } as Topic));
      const tree = buildTreeFromFlatList(allTopics);
      
      // Save built tree to meta/topicTree
      await adminDb.collection("meta").doc("topicTree").set({
        roots: tree,
        updatedAt: new Date().toISOString(),
      });

      return tree;
    } catch {
      return DEFAULT_FALLBACK_TREE;
    }
  },
  ["topic-tree-cache"],
  { tags: ["tree"], revalidate: 3600 }
);

export function buildTreeFromFlatList(topics: Topic[]): TopicNode[] {
  const map = new Map<string, TopicNode>();
  const roots: TopicNode[] = [];

  for (const t of topics) {
    map.set(t.id, { ...t, children: [] });
  }

  for (const t of topics) {
    const node = map.get(t.id)!;
    if (!t.parentId || !map.has(t.parentId)) {
      roots.push(node);
    } else {
      map.get(t.parentId)!.children.push(node);
    }
  }

  return roots;
}

/**
 * Finds a topic node anywhere in the tree by its ID or slug
 */
export function findTopicInTree(tree: TopicNode[], identifier: string): TopicNode | null {
  for (const node of tree) {
    if (node.id === identifier || node.slug === identifier) {
      return node;
    }
    const found = findTopicInTree(node.children, identifier);
    if (found) return found;
  }
  return null;
}

/**
 * Collects all descendant topic IDs from a given node (inclusive)
 */
export function getAllDescendantIds(node: TopicNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...getAllDescendantIds(child));
  }
  return ids;
}

/**
 * Get latest published blogs with cursor pagination
 */
export async function getLatestPublishedBlogs(
  limitCount = 10,
  cursorPublishedAt?: string
): Promise<{ blogs: Blog[]; nextCursor?: string }> {
  try {
    let q = adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc");

    if (cursorPublishedAt) {
      q = q.startAfter(cursorPublishedAt);
    }

    const snap = await q.limit(limitCount).get();
    const blogs: Blog[] = [];
    snap.forEach((doc) => {
      blogs.push(sanitizeBlog({ id: doc.id, ...doc.data() } as Blog));
    });

    const nextCursor =
      blogs.length === limitCount ? blogs[blogs.length - 1].publishedAt : undefined;

    return { blogs, nextCursor };
  } catch (err: unknown) {
    // Fallback if Firestore composite index is missing or building
    try {
      const snap = await adminDb
        .collection("blogs")
        .where("status", "==", "published")
        .get();

      const blogs: Blog[] = [];
      snap.forEach((doc) => {
        blogs.push(sanitizeBlog({ id: doc.id, ...doc.data() } as Blog));
      });

      blogs.sort((a, b) => {
        const dateA = a.publishedAt || a.createdAt || "";
        const dateB = b.publishedAt || b.createdAt || "";
        return dateB.localeCompare(dateA);
      });

      let startIndex = 0;
      if (cursorPublishedAt) {
        const cIdx = blogs.findIndex(
          (b) => (b.publishedAt || b.createdAt) === cursorPublishedAt
        );
        if (cIdx !== -1) startIndex = cIdx + 1;
      }

      const paged = blogs.slice(startIndex, startIndex + limitCount);
      const nextCursor =
        paged.length === limitCount
          ? paged[paged.length - 1].publishedAt || paged[paged.length - 1].createdAt
          : undefined;

      return { blogs: paged, nextCursor };
    } catch {
      return { blogs: [] };
    }
  }
}

/**
 * Get published blogs under a topic node (at any depth)
 */
export async function getBlogsByTopic(
  topicId: string,
  limitCount = 10,
  sortOrder: "desc" | "asc" = "desc",
  cursorPublishedAt?: string
): Promise<{ blogs: Blog[]; nextCursor?: string }> {
  try {
    let q = adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .where("topicPath", "array-contains", topicId)
      .orderBy("publishedAt", sortOrder);

    if (cursorPublishedAt) {
      q = q.startAfter(cursorPublishedAt);
    }

    const snap = await q.limit(limitCount).get();
    const blogs: Blog[] = [];
    snap.forEach((doc) => {
      blogs.push(sanitizeBlog({ id: doc.id, ...doc.data() } as Blog));
    });

    const nextCursor =
      blogs.length === limitCount ? blogs[blogs.length - 1].publishedAt : undefined;

    return { blogs, nextCursor };
  } catch (err: unknown) {
    // Fallback if Firestore composite index is missing or building
    try {
      const snap = await adminDb
        .collection("blogs")
        .where("topicPath", "array-contains", topicId)
        .get();

      const blogs: Blog[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Blog;
        if (data.status === "published") {
          blogs.push(sanitizeBlog({ ...data, id: doc.id }));
        }
      });

      blogs.sort((a, b) => {
        const dateA = a.publishedAt || a.createdAt || "";
        const dateB = b.publishedAt || b.createdAt || "";
        return sortOrder === "asc"
          ? dateA.localeCompare(dateB)
          : dateB.localeCompare(dateA);
      });

      let startIndex = 0;
      if (cursorPublishedAt) {
        const cIdx = blogs.findIndex(
          (b) => (b.publishedAt || b.createdAt) === cursorPublishedAt
        );
        if (cIdx !== -1) startIndex = cIdx + 1;
      }

      const paged = blogs.slice(startIndex, startIndex + limitCount);
      const nextCursor =
        paged.length === limitCount
          ? paged[paged.length - 1].publishedAt || paged[paged.length - 1].createdAt
          : undefined;

      return { blogs: paged, nextCursor };
    } catch {
      return { blogs: [] };
    }
  }
}

/**
 * Get single published blog by slug
 */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    let snap = await adminDb
      .collection("blogs")
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();

    if (snap.empty && slug.includes("_")) {
      snap = await adminDb
        .collection("blogs")
        .where("slug", "==", slug.replace(/_/g, "-"))
        .where("status", "==", "published")
        .limit(1)
        .get();
    }

    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    const data = doc.data() as Blog;

    // Check if blocks were split into a subcollection (for very large blogs)
    if (!data.blocks || data.blocks.length === 0) {
      const blocksSnap = await adminDb
        .collection("blogs")
        .doc(doc.id)
        .collection("blocks")
        .orderBy("order", "asc")
        .get();

      if (!blocksSnap.empty) {
        data.blocks = blocksSnap.docs.map((b) => b.data() as Blog["blocks"][0]);
      }
    }

    return sanitizeBlog({ ...data, id: doc.id });
  } catch {
    return null;
  }
}

/**
 * Get preceding and succeeding published blogs in the same subtopic
 */
export async function getPrevNextBlogs(
  subtopicId: string,
  currentPublishedAt: string
): Promise<{ prev: Blog | null; next: Blog | null }> {
  try {
    const [prevSnap, nextSnap] = await Promise.all([
      adminDb
        .collection("blogs")
        .where("status", "==", "published")
        .where("subtopicId", "==", subtopicId)
        .where("publishedAt", "<", currentPublishedAt)
        .orderBy("publishedAt", "desc")
        .limit(1)
        .get(),
      adminDb
        .collection("blogs")
        .where("status", "==", "published")
        .where("subtopicId", "==", subtopicId)
        .where("publishedAt", ">", currentPublishedAt)
        .orderBy("publishedAt", "asc")
        .limit(1)
        .get(),
    ]);

    const prev = !prevSnap.empty
      ? ({ id: prevSnap.docs[0].id, ...prevSnap.docs[0].data() } as Blog)
      : null;
    const next = !nextSnap.empty
      ? ({ id: nextSnap.docs[0].id, ...nextSnap.docs[0].data() } as Blog)
      : null;

    return { prev, next };
  } catch {
    // Fallback if Firestore composite index is missing or building
    try {
      const snap = await adminDb
        .collection("blogs")
        .where("subtopicId", "==", subtopicId)
        .get();

      const published: Blog[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Blog;
        if (data.status === "published") {
          published.push({ ...data, id: doc.id });
        }
      });

      published.sort((a, b) => {
        const dateA = a.publishedAt || a.createdAt || "";
        const dateB = b.publishedAt || b.createdAt || "";
        return dateA.localeCompare(dateB);
      });

      const currentIdx = published.findIndex(
        (b) => (b.publishedAt || b.createdAt) === currentPublishedAt
      );

      const prev = currentIdx > 0 ? published[currentIdx - 1] : null;
      const next =
        currentIdx >= 0 && currentIdx < published.length - 1
          ? published[currentIdx + 1]
          : null;

      return { prev, next };
    } catch {
      return { prev: null, next: null };
    }
  }
}

/**
 * Get related blogs (blogs sharing the same subtopic or keywords)
 */
export async function getRelatedBlogs(blog: Blog, limitCount = 3): Promise<Blog[]> {
  try {
    const snap = await adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .where("subtopicId", "==", blog.subtopicId)
      .limit(limitCount + 1)
      .get();

    const related: Blog[] = [];
    snap.forEach((doc) => {
      if (doc.id !== blog.id && related.length < limitCount) {
        related.push({ id: doc.id, ...doc.data() } as Blog);
      }
    });

    return related;
  } catch {
    return [];
  }
}
