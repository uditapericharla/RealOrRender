export interface VerificationReport {
  verification_id: string;
  decision: "ALLOW" | "WARN" | "BLOCK";
  credibility_score: number;
  ai_likelihood?: number;
  manipulation_signals?: string[];
  summary: string;
  article: {
    title: string;
    url: string;
    publisher?: string;
    published_date?: string;
  };
  claims: Array<{
    id: string;
    text: string;
    verdict: "SUPPORTED" | "CONTRADICTED" | "INSUFFICIENT";
    confidence: number;
    evidence: Array<{
      source: string;
      url: string;
      stance: "supports" | "contradicts" | "neutral";
      note: string;
    }>;
  }>;
}

export interface Post {
  id: string;
  verification_id: string;
  created_at: string;
  post_mode: "normal" | "warning_label";
  decision: "ALLOW" | "WARN" | "BLOCK";
  credibility_score: number;
  article_title: string;
  article_url: string;
  publisher?: string;
  summary: string;
}
