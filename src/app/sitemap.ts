import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import type { Blog, Topic } from "@/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/saved`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const [blogsSnap, topicsSnap] = await Promise.all([
      adminDb.collection("blogs").where("status", "==", "published").get(),
      adminDb.collection("topics").get(),
    ]);

    topicsSnap.forEach((doc) => {
      const t = doc.data() as Topic;
      entries.push({
        url: `${siteUrl}/topic/${t.slug || doc.id}`,
        lastModified: new Date(t.updatedAt || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    blogsSnap.forEach((doc) => {
      const b = doc.data() as Blog;
      entries.push({
        url: `${siteUrl}/blog/${b.slug}`,
        lastModified: new Date(b.updatedAt || Date.now()),
        changeFrequency: "monthly",
        priority: 0.9,
      });
    });
  } catch {
    // Return static entries if DB unreachable
  }

  return entries;
}
