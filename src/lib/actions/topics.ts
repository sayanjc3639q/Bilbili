"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { adminDb } from "../firebase/admin";
import { generateUniqueSubtopicId } from "../id-generator";
import { verifyAdminSession, SESSION_COOKIE_NAME } from "../firebase/session";
import { buildTreeFromFlatList } from "../queries";
import type { Topic, TopicNode } from "@/types";

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
 * Recomputes and writes the single denormalized meta/topicTree document
 */
export async function rebuildTopicTreeMeta(): Promise<TopicNode[]> {
  const topicsSnap = await adminDb.collection("topics").get();
  const allTopics: Topic[] = [];
  topicsSnap.forEach((d) => allTopics.push({ id: d.id, ...d.data() } as Topic));

  const tree = buildTreeFromFlatList(allTopics);

  await adminDb.collection("meta").doc("topicTree").set({
    roots: tree,
    updatedAt: new Date().toISOString(),
  });

  revalidateTag("tree", "max");
  return tree;
}

/**
 * Create a main topic (level 0, parentId = null)
 */
export async function createMainTopic(name: string, slug: string): Promise<Topic> {
  await assertAdmin();

  const id = slug.toLowerCase().trim();
  const docRef = adminDb.collection("topics").doc(id);
  const existing = await docRef.get();
  if (existing.exists) {
    throw new Error("A topic with this slug already exists.");
  }

  const topic: Topic = {
    id,
    name: name.trim(),
    slug: id,
    parentId: null,
    level: 0,
    ancestors: [],
    blogCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docRef.set(topic);
  await rebuildTopicTreeMeta();

  revalidatePath("/", "layout");
  revalidatePath("/admin/topics");
  return topic;
}

/**
 * Create a subtopic under a specified parent node.
 * Generates guaranteed-unique 6-character alphanumeric ID inside a Firestore transaction.
 */
export async function createSubtopic(
  name: string,
  slug: string,
  parentId: string
): Promise<Topic> {
  await assertAdmin();

  const parentDoc = await adminDb.collection("topics").doc(parentId).get();
  if (!parentDoc.exists) {
    throw new Error("Parent topic not found.");
  }

  const parentData = parentDoc.data() as Topic;
  const ancestors = [...(parentData.ancestors || []), parentId];
  const level = parentData.level + 1;

  // Generate 6-char unique ID with transactional collision check
  const subtopicId = await generateUniqueSubtopicId(adminDb, {
    name: name.trim(),
    parentId,
  });

  const topic: Topic = {
    id: subtopicId,
    name: name.trim(),
    slug: slug.toLowerCase().trim(),
    parentId,
    level,
    ancestors,
    blogCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await adminDb.collection("topics").doc(subtopicId).set(topic);
  await rebuildTopicTreeMeta();

  revalidatePath("/", "layout");
  revalidatePath("/admin/topics");
  return topic;
}

/**
 * Rename a topic
 */
export async function renameTopic(topicId: string, newName: string): Promise<void> {
  await assertAdmin();

  await adminDb.collection("topics").doc(topicId).update({
    name: newName.trim(),
    updatedAt: new Date().toISOString(),
  });

  await rebuildTopicTreeMeta();
  revalidatePath("/", "layout");
  revalidatePath("/admin/topics");
}

/**
 * Move a topic under a new parent.
 * Updates ancestors of all descendants and topicPath of affected blogs using batched writes in chunks under 500.
 */
export async function moveTopic(topicId: string, newParentId: string | null): Promise<void> {
  await assertAdmin();

  if (topicId === newParentId) {
    throw new Error("A topic cannot be its own parent.");
  }

  const topicDoc = await adminDb.collection("topics").doc(topicId).get();
  if (!topicDoc.exists) {
    throw new Error("Topic not found.");
  }

  let newAncestors: string[] = [];
  let newLevel = 0;

  if (newParentId) {
    const newParentDoc = await adminDb.collection("topics").doc(newParentId).get();
    if (!newParentDoc.exists) {
      throw new Error("Target parent topic not found.");
    }
    const parentData = newParentDoc.data() as Topic;
    if (parentData.ancestors.includes(topicId)) {
      throw new Error("Cannot move a topic into one of its own descendants.");
    }
    newAncestors = [...parentData.ancestors, newParentId];
    newLevel = parentData.level + 1;
  }

  // 1. Update the moved topic
  await adminDb.collection("topics").doc(topicId).update({
    parentId: newParentId,
    ancestors: newAncestors,
    level: newLevel,
    updatedAt: new Date().toISOString(),
  });

  // 2. Fetch all descendants to update their ancestors and levels
  const descendantsSnap = await adminDb
    .collection("topics")
    .where("ancestors", "array-contains", topicId)
    .get();

  const oldAncestorsPrefix = [...(topicDoc.data() as Topic).ancestors, topicId];
  const newAncestorsPrefix = [...newAncestors, topicId];

  const affectedTopicIds = [topicId];

  // Batch update descendants in chunks of up to 400
  let batch = adminDb.batch();
  let count = 0;

  for (const doc of descendantsSnap.docs) {
    const dData = doc.data() as Topic;
    affectedTopicIds.push(doc.id);

    // Replace the old ancestor prefix with the new one
    const suffix = dData.ancestors.slice(oldAncestorsPrefix.length);
    const updatedAncestors = [...newAncestorsPrefix, ...suffix];
    const updatedLevel = updatedAncestors.length;

    batch.update(doc.ref, {
      ancestors: updatedAncestors,
      level: updatedLevel,
      updatedAt: new Date().toISOString(),
    });

    count++;
    if (count >= 400) {
      await batch.commit();
      batch = adminDb.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  // 3. Update topicPath of all affected blogs
  // For each affected topic, any blog with subtopicId == affectedTopic needs its topicPath updated
  for (const affId of affectedTopicIds) {
    const blogsSnap = await adminDb
      .collection("blogs")
      .where("subtopicId", "==", affId)
      .get();

    const topicRefDoc = await adminDb.collection("topics").doc(affId).get();
    const tData = topicRefDoc.data() as Topic;
    const resolvedPath = [...tData.ancestors, affId];

    let bBatch = adminDb.batch();
    let bCount = 0;

    for (const bDoc of blogsSnap.docs) {
      bBatch.update(bDoc.ref, {
        topicPath: resolvedPath,
        updatedAt: new Date().toISOString(),
      });
      bCount++;
      if (bCount >= 400) {
        await bBatch.commit();
        bBatch = adminDb.batch();
        bCount = 0;
      }
    }
    if (bCount > 0) {
      await bBatch.commit();
    }
  }

  await rebuildTopicTreeMeta();
  revalidatePath("/", "layout");
  revalidatePath("/admin/topics");
}

/**
 * Delete a topic. Only permitted if the node has no children and no blogs.
 */
export async function deleteTopic(topicId: string): Promise<void> {
  await assertAdmin();

  // Check if topic has child subtopics
  const childrenSnap = await adminDb
    .collection("topics")
    .where("parentId", "==", topicId)
    .limit(1)
    .get();

  if (!childrenSnap.empty) {
    throw new Error("Cannot delete topic: it contains child subtopics. Move or delete them first.");
  }

  // Check if topic has blogs
  const blogsSnap = await adminDb
    .collection("blogs")
    .where("subtopicId", "==", topicId)
    .limit(1)
    .get();

  if (!blogsSnap.empty) {
    throw new Error("Cannot delete topic: it contains active blogs.");
  }

  await adminDb.collection("topics").doc(topicId).delete();
  // Also clean up subtopic_ids reservation if it exists
  await adminDb.collection("subtopic_ids").doc(topicId).delete().catch(() => {});

  await rebuildTopicTreeMeta();
  revalidatePath("/", "layout");
  revalidatePath("/admin/topics");
}
