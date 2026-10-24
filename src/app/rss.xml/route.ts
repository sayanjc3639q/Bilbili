import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Blog } from "@/types";

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let blogs: Blog[] = [];
  try {
    const snap = await adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(30)
      .get();

    blogs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Blog));
  } catch {
    blogs = [];
  }

  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const itemsXml = blogs
    .map(
      (b) => `
    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${siteUrl}/blog/${b.slug}</link>
      <guid>${siteUrl}/blog/${b.slug}</guid>
      <pubDate>${new Date(b.publishedAt || b.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(b.excerpt || "")}</description>
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Bilbili</title>
    <link>${siteUrl}</link>
    <description>A simple, text-first educational knowledge repository.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
