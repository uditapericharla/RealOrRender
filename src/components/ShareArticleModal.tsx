"use client";

import { useState } from "react";
import type { Post, VerificationReport } from "@/types";
import { verifyArticle } from "@/lib/api";
import { VerificationSummary } from "./VerificationSummary";

interface ShareArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
}

export function ShareArticleModal({
  isOpen,
  onClose,
  onPostCreated,
}: ShareArticleModalProps) {
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const reset = () => {
    setUrl("");
    setComment("");
    setReport(null);
    setStatus("idle");
    setErrorMsg("");
    setIsPosting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleVerify = async () => {
    if (!url.trim()) return;
    setStatus("verifying");
    setErrorMsg("");
    setReport(null);

    try {
      const result = await verifyArticle(url.trim(), comment.trim() || undefined);
      setReport(result);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handlePost = async (mode: "normal" | "warning_label") => {
    if (!report) return;
    setIsPosting(true);
    try {
      const { createPost } = await import("@/lib/api");
      const post = await createPost(report.verification_id, mode);
      onPostCreated(post);
      handleClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Share Article
          </h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label
              htmlFor="article-url"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Article URL
            </label>
            <input
              id="article-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              disabled={status === "verifying"}
            />
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Comment (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your thoughts..."
              rows={2}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 resize-none"
              disabled={status === "verifying"}
            />
          </div>

          {status === "verifying" && (
            <div className="flex items-center gap-2 text-stone-600">
              <svg
                className="animate-spin h-5 w-5"
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
              <span className="text-sm">Verifying…</span>
            </div>
          )}

          {status === "error" && (
            <p className="text-sm text-block">{errorMsg}</p>
          )}

          {!report ? (
            <button
              onClick={handleVerify}
              disabled={status === "verifying" || !url.trim()}
              className="w-full rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify Article
            </button>
          ) : (
            <VerificationSummary
              report={report}
              onPost={handlePost}
              isPosting={isPosting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
