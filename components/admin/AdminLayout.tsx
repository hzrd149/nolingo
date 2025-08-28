import Head from "next/head";
import Link from "next/link";
import { PropsWithChildren } from "react";

export default function AdminLayout({
  children,
  title,
  tab,
}: PropsWithChildren<{ title: string; tab: string }>) {
  return (
    <div className="h-screen flex flex-col">
      <Head>
        <title>{title} - Admin - Nolingo</title>
        <meta name="description" content="Users management for Nolingo" />
      </Head>

      <div className="join">
        <Link
          className={`btn ${tab === "users" ? "btn-primary" : ""}`}
          href="/admin/users"
        >
          Users
        </Link>
        <Link
          className={`btn ${tab === "posts" ? "btn-primary" : ""}`}
          href="/admin/posts"
        >
          Posts
        </Link>
        <Link
          className={`btn ${tab === "replies" ? "btn-primary" : ""}`}
          href="/admin/replies"
        >
          Replies
        </Link>
        <Link
          className={`btn ${tab === "images" ? "btn-primary" : ""}`}
          href="/admin/images"
        >
          Images
        </Link>
        <Link
          className={`btn ${tab === "translations" ? "btn-primary" : ""}`}
          href="/admin/translations"
        >
          Translations
        </Link>
      </div>

      <div className="flex-grow overflow-auto">{children}</div>
    </div>
  );
}
