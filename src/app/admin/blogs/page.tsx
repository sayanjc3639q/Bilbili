import { adminDb } from "@/lib/firebase/admin";
import { getCachedTopicTree } from "@/lib/queries";
import { BlogsManager } from "@/components/admin/blogs-manager";
import type { Blog } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  let blogs: Blog[] = [];
  try {
    const snap = await adminDb
      .collection("blogs")
      .orderBy("updatedAt", "desc")
      .get();

    blogs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Blog));
  } catch {
    blogs = [];
  }

  const tree = await getCachedTopicTree();

  return <BlogsManager initialBlogs={blogs} tree={tree} />;
}
