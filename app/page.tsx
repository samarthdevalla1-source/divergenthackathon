"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { NotesForm } from "@/components/notes-form";
import { ResultsPanel } from "@/components/results-panel";
import type { SimplifyResponse } from "@/lib/types";

const EXAMPLE_NOTES =
  "Patient diagnosed with mild hypertension. Prescribed lisinopril 10mg daily. Reduce sodium intake. Follow up in 2 weeks. Call the office if dizziness gets worse or if new chest pain happens.";

export default function HomePage() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<SimplifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSimplify() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notes })
      });

      const payload = (await response.json()) as SimplifyResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Unable to simplify instructions.");
      }

      setResult(payload);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while simplifying the instructions.";
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoadExample() {
    setNotes(EXAMPLE_NOTES);
    setError(null);
  }

  function handleReset() {
    setNotes("");
    setResult(null);
    setError(null);
  }

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-50" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <AppHeader />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <NotesForm
            notes={notes}
            error={error}
            isLoading={isLoading}
            onChange={setNotes}
            onLoadExample={handleLoadExample}
            onReset={handleReset}
            onSubmit={handleSimplify}
          />

          <div className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-soft">
            {!result && !isLoading ? <EmptyState /> : null}
            {isLoading ? <LoadingState /> : null}
            {result ? <ResultsPanel result={result} /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
