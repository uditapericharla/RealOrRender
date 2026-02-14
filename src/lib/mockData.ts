import type { VerificationReport } from "@/types";

export const MOCK_ALLOW_REPORT: VerificationReport = {
  verification_id: "mock-allow-001",
  decision: "ALLOW",
  credibility_score: 82,
  ai_likelihood: 0.12,
  manipulation_signals: [],
  summary: "Article from reputable source with well-sourced claims. No significant manipulation detected.",
  article: {
    title: "Climate Scientists Agree on 97% Consensus: Comprehensive Review",
    url: "https://example.com/climate-consensus",
    publisher: "Science Journal",
    published_date: "2024-01-15",
  },
  claims: [
    {
      id: "c1",
      text: "97% of climate scientists agree that human activity is causing global warming.",
      verdict: "SUPPORTED",
      confidence: 0.95,
      evidence: [
        {
          source: "NASA Climate",
          url: "https://climate.nasa.gov",
          stance: "supports",
          note: "Multiple peer-reviewed studies confirm this consensus.",
        },
      ],
    },
    {
      id: "c2",
      text: "Global temperatures have risen 1.1°C since pre-industrial times.",
      verdict: "SUPPORTED",
      confidence: 0.98,
      evidence: [
        {
          source: "NOAA",
          url: "https://noaa.gov",
          stance: "supports",
          note: "Direct temperature measurements support this figure.",
        },
      ],
    },
  ],
};

export const MOCK_WARN_REPORT: VerificationReport = {
  verification_id: "mock-warn-002",
  decision: "WARN",
  credibility_score: 42,
  ai_likelihood: 0.78,
  manipulation_signals: [
    "Emotional language",
    "Cherry-picked statistics",
    "Unverified claims",
  ],
  summary: "Article contains several unverified claims and uses persuasive techniques. Exercise caution.",
  article: {
    title: "Shocking Study Reveals What They Don't Want You to Know",
    url: "https://example.com/sensational-article",
    publisher: "Opinion Blog",
    published_date: "2024-02-01",
  },
  claims: [
    {
      id: "c1",
      text: "New study proves mainstream science is wrong.",
      verdict: "INSUFFICIENT",
      confidence: 0.3,
      evidence: [
        {
          source: "Retraction Watch",
          url: "https://retractionwatch.com",
          stance: "contradicts",
          note: "The cited study has been criticized for methodological flaws.",
        },
      ],
    },
    {
      id: "c2",
      text: "Experts are hiding the truth from the public.",
      verdict: "CONTRADICTED",
      confidence: 0.15,
      evidence: [
        {
          source: "Fact Check Database",
          url: "https://factcheck.org",
          stance: "contradicts",
          note: "No evidence supports this conspiracy claim.",
        },
      ],
    },
  ],
};

export const MOCK_BLOCK_REPORT: VerificationReport = {
  verification_id: "mock-block-003",
  decision: "BLOCK",
  credibility_score: 15,
  ai_likelihood: 0.92,
  manipulation_signals: [
    "Fabricated sources",
    "Deepfake indicators",
    "Coordinated inauthentic content",
  ],
  summary: "High-risk misinformation. Multiple claims are fabricated and sources cannot be verified.",
  article: {
    title: "BREAKING: Government Cover-up Exposed",
    url: "https://example.com/fake-news",
    publisher: "Unknown",
    published_date: "2024-02-10",
  },
  claims: [
    {
      id: "c1",
      text: "Government officials admitted to covering up evidence.",
      verdict: "CONTRADICTED",
      confidence: 0.02,
      evidence: [
        {
          source: "Reuters Fact Check",
          url: "https://reuters.com",
          stance: "contradicts",
          note: "No such admission exists. Fabricated quote.",
        },
      ],
    },
  ],
};
