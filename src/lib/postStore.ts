"use client";

import type { Post } from "@/types";

const STORAGE_KEY = "realorrender-posts";

export function savePostToStorage(post: Post): void {
  if (typeof window === "undefined") return;
  const posts = getPostsFromStorage();
  posts.unshift(post);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getPostsFromStorage(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
