"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/types";
import { fetchPosts } from "@/lib/api";
import { getPostsFromStorage } from "@/lib/postStore";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPosts();
      setPosts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setPosts(getPostsFromStorage());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return { posts, loading, error, addPost, refresh: loadPosts };
}
