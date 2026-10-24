import { NextRequest, NextResponse } from "next/server";
import { getLatestPublishedBlogs, getBlogsByTopic } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const topicId = searchParams.get("topicId") || undefined;
  const sort = (searchParams.get("sort") === "asc" ? "asc" : "desc") as "asc" | "desc";

  try {
    if (topicId) {
      const data = await getBlogsByTopic(topicId, limit, sort, cursor);
      return NextResponse.json(data);
    } else {
      const data = await getLatestPublishedBlogs(limit, cursor);
      return NextResponse.json(data);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching blogs";
    return NextResponse.json({ error: message, blogs: [] }, { status: 500 });
  }
}
