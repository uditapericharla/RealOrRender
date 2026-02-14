"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { VerificationReport } from "@/types";
import { fetchReport } from "@/lib/api";
import { DecisionBadge } from "@/components/DecisionBadge";
import { ClaimTable } from "@/components/ClaimTable";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const verificationId = params.verificationId as string;
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!verificationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchReport(verificationId)
      .then((data) => {
        if (!cancelled) {
          setReport(data);
          if (!data) setError("Report not found");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load report");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [verificationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg
          className="animate-spin h-10 w-10 text-stone-400"
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
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-stone-600 mb-4">{error || "Report not found"}</p>
        <Link
          href="/"
          className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-sm text-stone-600 hover:text-stone-900 mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-stone-900">
            Verification Report
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <DecisionBadge decision={report.decision} />
            <span className="text-sm font-medium text-stone-600">
              Credibility: {report.credibility_score}/100
            </span>
            {report.ai_likelihood !== undefined && (
              <span className="text-sm text-stone-500">
                AI likelihood: {Math.round(report.ai_likelihood * 100)}%
              </span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full ${
                report.credibility_score >= 70
                  ? "bg-allow"
                  : report.credibility_score >= 40
                  ? "bg-warn"
                  : "bg-block"
              }`}
              style={{ width: `${report.credibility_score}%` }}
            />
          </div>
          <h2 className="font-semibold text-stone-900 mb-1">
            {report.article.title}
          </h2>
          <a
            href={report.article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {report.article.url}
          </a>
          {report.article.publisher && (
            <p className="text-sm text-stone-500 mt-1">
              {report.article.publisher}
              {report.article.published_date &&
                ` • ${report.article.published_date}`}
            </p>
          )}
          <p className="text-stone-600 mt-3">{report.summary}</p>
        </div>

        {report.manipulation_signals &&
          report.manipulation_signals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-2">
                Manipulation signals
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.manipulation_signals.map((signal, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

        <div>
          <h3 className="text-sm font-medium text-stone-700 mb-2">
            Claims & Evidence
          </h3>
          <ClaimTable claims={report.claims} />
        </div>

        <Link
          href="/"
          className="inline-block rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Back to Feed
        </Link>
      </main>
    </div>
  );
}
