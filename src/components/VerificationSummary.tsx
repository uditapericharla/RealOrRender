"use client";

import Link from "next/link";
import type { VerificationReport } from "@/types";
import { DecisionBadge } from "./DecisionBadge";
import { ClaimTable } from "./ClaimTable";

interface VerificationSummaryProps {
  report: VerificationReport;
  onPost: (mode: "normal" | "warning_label") => void;
  isPosting?: boolean;
}

export function VerificationSummary({
  report,
  onPost,
  isPosting = false,
}: VerificationSummaryProps) {
  const { decision, credibility_score, ai_likelihood, manipulation_signals } =
    report;

  const canPostNormal = decision === "ALLOW";
  const canPostWarning = decision === "WARN";

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-medium text-stone-500 mb-1">
            Credibility Score
          </p>
          <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                credibility_score >= 70
                  ? "bg-allow"
                  : credibility_score >= 40
                  ? "bg-warn"
                  : "bg-block"
              }`}
              style={{ width: `${credibility_score}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-stone-700 mt-0.5">
            {credibility_score}/100
          </p>
        </div>
        <DecisionBadge decision={decision} />
      </div>

      {ai_likelihood !== undefined && (
        <p className="text-sm text-stone-600">
          AI likelihood:{" "}
          <span className="font-medium">
            {Math.round(ai_likelihood * 100)}%
          </span>
        </p>
      )}

      {manipulation_signals && manipulation_signals.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 mb-2">
            Manipulation signals
          </p>
          <div className="flex flex-wrap gap-2">
            {manipulation_signals.map((signal, i) => (
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

      <p className="text-sm text-stone-600">{report.summary}</p>

      <div>
        <p className="text-xs font-medium text-stone-500 mb-2">
          Claims preview
        </p>
        <ClaimTable claims={report.claims} maxRows={5} compact />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {canPostNormal && (
          <button
            onClick={() => onPost("normal")}
            disabled={isPosting}
            className="rounded-md bg-allow px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? "Posting…" : "Post"}
          </button>
        )}
        {canPostWarning && (
          <button
            onClick={() => onPost("warning_label")}
            disabled={isPosting}
            className="rounded-md bg-warn px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? "Posting…" : "Post with Warning Label"}
          </button>
        )}
        {decision === "BLOCK" && (
          <p className="text-sm text-block font-medium">
            High-risk misinformation — posting disabled
          </p>
        )}
        <Link
          href={`/report/${report.verification_id}`}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          View Full Report
        </Link>
      </div>
    </div>
  );
}
