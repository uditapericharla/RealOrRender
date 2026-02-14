"use client";

import Link from "next/link";
import type { Post } from "@/types";
import { DecisionBadge } from "./DecisionBadge";

interface PostCardProps {
  post: Post;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostCard({ post }: PostCardProps) {
  const hasWarning = post.post_mode === "warning_label";

  return (
    <Link href={`/report/${post.verification_id}`}>
      <article className="rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-300 hover:shadow-md transition-shadow">
        {hasWarning && (
          <div className="mb-3 -mx-4 -mt-4 px-4 py-2 rounded-t-xl bg-warn-light border-b border-warn/30">
            <p className="text-sm font-medium text-warn flex items-center gap-2">
              <span aria-hidden>⚠️</span>
              This post was shared with a warning label. Viewer discretion advised.
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <DecisionBadge decision={post.decision} size="sm" />
          <span className="text-xs text-stone-500 font-medium">
            Score: {post.credibility_score}/100
          </span>
          <span className="text-xs text-stone-400">
            {formatDate(post.created_at)}
          </span>
        </div>
        <h3 className="font-semibold text-stone-900 mb-1 line-clamp-2">
          {post.article_title}
        </h3>
        <p className="text-xs text-stone-500 mb-2">
          {post.publisher || getDomain(post.article_url)}
        </p>
        <p className="text-sm text-stone-600 line-clamp-2">{post.summary}</p>
      </article>
    </Link>
  );
}
