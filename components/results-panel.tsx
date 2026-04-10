"use client";

import { useState } from "react";
import { ResultCard } from "@/components/result-card";
import type { SimplifyResponse } from "@/lib/types";

type ResultsPanelProps = {
  result: SimplifyResponse;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const fullSummary = [
    `Explanation: ${result.explanation}`,
    "",
    "Actions:",
    ...result.actions.map((item) => `- ${item}`),
    "",
    "Warnings:",
    ...result.warnings.map((item) => `- ${item}`),
    "",
    "Questions:",
    ...result.questions.map((item) => `- ${item}`)
  ].join("\n");

  async function handleCopy() {
    try {
      await copyText(fullSummary);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.24em] text-sky-700">
            Output
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Simplified patient instructions</h2>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy Summary"}
        </button>
      </div>

      <ResultCard eyebrow="Explanation" title="What this means">
        <p>{result.explanation}</p>
      </ResultCard>

      <ResultCard eyebrow="Actions" title="What the patient should do">
        <BulletList items={result.actions} emptyMessage="No action steps were clearly provided in the notes." />
      </ResultCard>

      <ResultCard eyebrow="Warnings" title="What to watch for">
        <BulletList items={result.warnings} emptyMessage="No specific warning signs were provided in the notes." />
      </ResultCard>

      <ResultCard eyebrow="Questions" title="Helpful follow-up questions">
        <BulletList items={result.questions} emptyMessage="No follow-up questions were generated for this note." />
      </ResultCard>
    </div>
  );
}

function BulletList({
  items,
  emptyMessage
}: {
  items: string[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-3">
          <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
