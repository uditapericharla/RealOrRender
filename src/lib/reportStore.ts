"use client";

import type { VerificationReport } from "@/types";

const STORAGE_KEY_PREFIX = "realorrender-report-";

export function saveReportToStorage(report: VerificationReport): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${report.verification_id}`,
      JSON.stringify(report)
    );
  } catch {
    // Ignore storage errors
  }
}

export function getReportFromStorage(
  verificationId: string
): VerificationReport | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${verificationId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
