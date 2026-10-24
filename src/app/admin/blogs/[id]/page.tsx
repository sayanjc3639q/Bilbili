import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { Blog } from "@/types";

export const dynamic = "force-dynamic";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params;

  let blog: Blog | null = null;
  try {
    const doc = await adminDb.collection("blogs").doc(id).get();
    if (doc.exists) {
      const data = doc.data() as Blog;

      // If blocks are in subcollection
      if (!data.blocks || data.blocks.length === 0) {
        const blocksSnap = await adminDb
          .collection("blogs")
          .doc(id)
          .collection("blocks")
          .orderBy("order", "asc")
          .get();

        if (!blocksSnap.empty) {
          data.blocks = blocksSnap.docs.map((b) => b.data() as Blog["blocks"][0]);
        }
      }

      blog = { ...data, id: doc.id };
    }
  } catch {
    blog = null;
  }

  if (!blog) {
    notFound();
  }

  return <BlogEditor initialBlog={blog} />;
}
