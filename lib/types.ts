export type SimplifyResponse = {
  explanation: string;
  actions: string[];
  warnings: string[];
  questions: string[];
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export function coerceSimplifyResponse(value: unknown): SimplifyResponse {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const explanation =
    typeof record.explanation === "string" && record.explanation.trim().length > 0
      ? record.explanation.trim()
      : "We could not confidently simplify these notes, but you can try again or ask your clinician for clarification.";

  const actions = normalizeStringArray(record.actions);
  const warnings = normalizeStringArray(record.warnings);
  const questions = normalizeStringArray(record.questions);

  return {
    explanation,
    actions,
    warnings:
      warnings.length > 0
        ? warnings
        : ["Ask your doctor what warning signs or symptoms should prompt a call or urgent care."],
    questions
  };
}
