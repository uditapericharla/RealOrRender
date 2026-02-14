import type { VerificationReport } from "@/types";

type Verdict = VerificationReport["claims"][0]["verdict"];

const VERDICT_STYLES: Record<Verdict, { bg: string; text: string }> = {
  SUPPORTED: { bg: "bg-allow-light", text: "text-allow" },
  CONTRADICTED: { bg: "bg-block-light", text: "text-block" },
  INSUFFICIENT: { bg: "bg-warn-light", text: "text-warn" },
};

interface ClaimTableProps {
  claims: VerificationReport["claims"];
  maxRows?: number;
  compact?: boolean;
}

export function ClaimTable({ claims, maxRows, compact = false }: ClaimTableProps) {
  const displayClaims = maxRows ? claims.slice(0, maxRows) : claims;

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-100">
            <th className="px-4 py-2 font-medium text-stone-700">Claim</th>
            <th className="px-4 py-2 font-medium text-stone-700">Verdict</th>
            <th className="px-4 py-2 font-medium text-stone-700">Confidence</th>
            {!compact && (
              <th className="px-4 py-2 font-medium text-stone-700">Evidence</th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayClaims.map((claim) => {
            const vs = VERDICT_STYLES[claim.verdict];
            return (
              <tr
                key={claim.id}
                className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
              >
                <td className="px-4 py-3 text-stone-800 max-w-md">
                  {claim.text}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${vs.bg} ${vs.text}`}
                  >
                    {claim.verdict}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {Math.round(claim.confidence * 100)}%
                </td>
                {!compact && (
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {claim.evidence.map((e, i) => (
                        <li key={i} className="text-xs">
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {e.source}
                          </a>
                          <span className="text-stone-500"> — {e.stance}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
