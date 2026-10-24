import { getCachedTopicTree } from "@/lib/queries";
import { TopicsManager } from "@/components/admin/topics-manager";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
  const tree = await getCachedTopicTree();

  return (
    <div>
      <TopicsManager initialTree={tree} />
    </div>
  );
}
