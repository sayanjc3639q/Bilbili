import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminSession, SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { LayoutDashboard, FolderTree, FileText, PlusCircle, LogOut } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/logout-button";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Let the login page render freely
  // For other admin pages, verify admin session
  // Note: Middleware handles the first check, this ensures deep verification
  const verification = await verifyAdminSession(sessionCookie);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Top Navigation */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-bold text-base tracking-tight text-[var(--text-primary)] flex items-center gap-2"
            >
              <span className="w-2 h-2 bg-red-600 inline-block" />
              <span>Bilbili Admin</span>
            </Link>

            {verification.isValid && verification.isAdmin && (
              <nav className="hidden sm:flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
                <Link
                  href="/admin"
                  className="hover:text-[var(--text-primary)] flex items-center gap-1.5 py-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/topics"
                  className="hover:text-[var(--text-primary)] flex items-center gap-1.5 py-1"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Topics Manager</span>
                </Link>
                <Link
                  href="/admin/blogs"
                  className="hover:text-[var(--text-primary)] flex items-center gap-1.5 py-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Blogs List</span>
                </Link>
              </nav>
            )}
          </div>

          {verification.isValid && verification.isAdmin && (
            <div className="flex items-center gap-3">
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-hover)] transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Blog</span>
              </Link>

              <AdminLogoutButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
