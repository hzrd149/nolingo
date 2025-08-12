import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import ISO6391 from "iso-639-1";

interface DrawerProps {
  children: React.ReactNode;
}

export default function Drawer({ children }: DrawerProps) {
  const { data: session, status } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="main-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isDrawerOpen}
        onChange={toggleDrawer}
      />

      <div className="drawer-content flex flex-col">
        {/* Top navigation bar for mobile */}
        <div className="w-full navbar bg-base-100 lg:hidden">
          <div className="flex-none">
            <label
              htmlFor="main-drawer"
              className="btn btn-square btn-ghost"
              onClick={toggleDrawer}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Nolingo</h1>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Side drawer */}
      <div className="drawer-side">
        <label
          htmlFor="main-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
          onClick={toggleDrawer}
        ></label>

        <div className="min-h-full w-80 bg-base-200 text-base-content">
          {/* App header */}
          <div className="p-4 border-b border-base-300">
            <h1 className="text-2xl font-bold text-primary">Nolingo</h1>
            <p className="text-sm text-base-content/70">
              Language Learning Platform
            </p>
          </div>

          {/* User section */}
          <div className="p-4 border-b border-base-300">
            {status === "loading" ? (
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="skeleton h-4 w-24"></div>
              </div>
            ) : session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-10">
                      <span className="text-lg">
                        {session.user?.display_name?.[0] ||
                          session.user?.username?.[0] ||
                          "U"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {session.user?.display_name || session.user?.username}
                    </p>
                    <p className="text-sm text-base-content/70 truncate">
                      @{session.user?.username}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-ghost btn-sm"
                    title="Sign out"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>

                {/* Learning Language */}
                {session.user?.learning_language && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-base-content/70">Learning:</span>
                    <span className="badge badge-primary badge-sm">
                      {ISO6391.getName(session.user.learning_language)} (
                      {session.user.learning_language.toUpperCase()})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-base-content/70 mb-3">
                  Not signed in
                </p>
                <Link href="/login" className="btn btn-primary btn-sm w-full">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <h3 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider p-4">
            Navigation
          </h3>
          <ul className="menu menu-md w-full space-y-2">
            <li>
              <Link href="/post/new" onClick={() => setIsDrawerOpen(false)}>
                <span className="text-lg">✏️</span>
                New Post
              </Link>
            </li>
            <li>
              <Link href="/" onClick={() => setIsDrawerOpen(false)}>
                <span className="text-lg">🏠</span>
                Home
              </Link>
            </li>
            <li>
              <Link href="/profile" onClick={() => setIsDrawerOpen(false)}>
                <span className="text-lg">👤</span>
                Profile
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={() => setIsDrawerOpen(false)}>
                <span className="text-lg">⚙️</span>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
