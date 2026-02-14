import type { VerificationReport } from "@/types";

type Decision = VerificationReport["decision"];

const STYLES: Record<
  Decision,
  { bg: string; text: string; border: string; label: string }
> = {
  ALLOW: {
    bg: "bg-allow-light",
    text: "text-allow",
    border: "border-allow",
    label: "Allow",
  },
  WARN: {
    bg: "bg-warn-light",
    text: "text-warn",
    border: "border-warn",
    label: "Warning",
  },
  BLOCK: {
    bg: "bg-block-light",
    text: "text-block",
    border: "border-block",
    label: "Blocked",
  },
};

interface DecisionBadgeProps {
  decision: Decision;
  size?: "sm" | "md";
  className?: string;
}

export function DecisionBadge({ decision, size = "md", className = "" }: DecisionBadgeProps) {
  const style = STYLES[decision];
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${className}`}
    >
      {style.label}
    </span>
  );
}
