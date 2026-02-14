import type { Post, VerificationReport } from "@/types";
import { MOCK_ALLOW_REPORT, MOCK_WARN_REPORT, MOCK_BLOCK_REPORT } from "./mockData";
import { getPostsFromStorage, savePostToStorage } from "./postStore";
import { getReportFromStorage, saveReportToStorage } from "./reportStore";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function verifyArticle(url: string, comment?: string): Promise<VerificationReport> {
  try {
    const res = await fetch(`${BASE_URL}/api/verifyArticle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, comment }),
    });

    if (!res.ok) {
      throw new Error(`Verify failed: ${res.status}`);
    }

    const report = await res.json();
    saveReportToStorage(report);
    return report;
  } catch (error) {
    // Fallback to mock data for demo/offline
    console.warn("Verify API unavailable, using mock data:", error);
    if (url.includes("block") || url.includes("fake")) {
      const report = {
        ...MOCK_BLOCK_REPORT,
        verification_id: `mock-${Date.now()}`,
        decision: "BLOCK",
      } as VerificationReport;
      saveReportToStorage(report);
      return report;
    }
    const report = {
      ...(url.includes("warn") ? MOCK_WARN_REPORT : MOCK_ALLOW_REPORT),
      verification_id: `mock-${Date.now()}`,
    } as VerificationReport;
    saveReportToStorage(report);
    return report;
  }
}

export async function createPost(
  verification_id: string,
  post_mode: "normal" | "warning_label"
): Promise<Post> {
  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_id, post_mode }),
    });

    if (!res.ok) {
      throw new Error(`Create post failed: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    // Fallback: create local post from stored report or mock
    console.warn("Posts API unavailable, using local store:", error);
    const stored = getReportFromStorage(verification_id);
    const report = stored ?? (verification_id.includes("allow") ? MOCK_ALLOW_REPORT : MOCK_WARN_REPORT);
    const post: Post = {
      id: `local-${Date.now()}`,
      verification_id,
      created_at: new Date().toISOString(),
      post_mode,
      decision: report.decision,
      credibility_score: report.credibility_score,
      article_title: report.article.title,
      article_url: report.article.url,
      publisher: report.article.publisher,
      summary: report.summary,
    };
    savePostToStorage(post);
    return post;
  }
}

export async function fetchPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/posts`);
    if (!res.ok) {
      throw new Error(`Fetch posts failed: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    // Fallback to localStorage
    console.warn("Posts API unavailable, using localStorage:", error);
    return getPostsFromStorage();
  }
}

export async function fetchReport(verificationId: string): Promise<VerificationReport | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/reports/${verificationId}`);
    if (!res.ok) {
      throw new Error(`Fetch report failed: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    // Fallback: check localStorage, then mock if ID matches
    const stored = getReportFromStorage(verificationId);
    if (stored) return stored;
    if (verificationId.includes("mock-allow")) return MOCK_ALLOW_REPORT;
    if (verificationId.includes("mock-warn")) return MOCK_WARN_REPORT;
    if (verificationId.includes("mock-block")) return MOCK_BLOCK_REPORT;
    return null;
  }
}
