"use client";

import { useState } from "react";
import { ShareArticleModal } from "@/components/ShareArticleModal";
import { PostCard } from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { IS_DEMO_MODE } from "@/lib/api";

export default function HomePage() {
  const { posts, loading, error, addPost } = usePosts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-xl font-bold text-stone-900">
            RealOrRender
          </h1>
          <p className="text-sm text-stone-500">
            Pre-share verification for article links
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
          >
            Share Article
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {IS_DEMO_MODE && (
          <div className="mb-4 rounded-md bg-warn-light border border-warn/30 p-3 text-sm text-warn">
            Demo mode: using sample data. To analyze real articles, set <code className="bg-white/50 px-1 rounded">NEXT_PUBLIC_API_BASE_URL=http://localhost:8000</code> in <code className="bg-white/50 px-1 rounded">.env.local</code> and run the backend.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-warn-light border border-warn/30 p-3 text-sm text-warn">
            {error} — showing locally stored posts.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-stone-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
            <p className="text-sm">No posts yet.</p>
            <p className="text-xs mt-1">Share an article to get started.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <ShareArticleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onPostCreated={addPost}
      />
    </div>
  );
}
