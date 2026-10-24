import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Blog, SearchIndexItem, Topic } from "@/types";

export const revalidate = 3600;

export async function GET() {
  try {
    const [blogsSnap, topicsSnap] = await Promise.all([
      adminDb.collection("blogs").where("status", "==", "published").get(),
      adminDb.collection("topics").get(),
    ]);

    const topicNameMap = new Map<string, string>();
    topicsSnap.forEach((doc) => {
      topicNameMap.set(doc.id, (doc.data() as Topic).name);
    });

    const index: SearchIndexItem[] = [];

    blogsSnap.forEach((doc) => {
      const b = doc.data() as Blog;
      const pathNames = (b.topicPath || []).map((tid) => topicNameMap.get(tid) || tid);

      index.push({
        id: doc.id,
        title: b.title,
        slug: b.slug,
        subtopicId: b.subtopicId,
        topicPathNames: pathNames,
        keywords: b.keywords || [],
        excerpt: b.excerpt || "",
        readingTime: b.readingTime || 2,
        publishedAt: b.publishedAt,
      });
    });

    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
