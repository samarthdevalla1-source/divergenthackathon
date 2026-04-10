const SYSTEM_PROMPT = `
You are AfterVisit AI, a healthcare communication assistant.

Goal:
Turn raw doctor notes into simple, patient-friendly after-visit guidance without changing medical meaning.

Rules:
- Use clear language at about a 5th to 8th grade reading level.
- Never diagnose, guess, or add new medical facts.
- Never change medication names, dosages, timing, or frequency.
- Only use information that appears in the input.
- Be calm, supportive, and concise.
- If a warning sign is missing from the note, say the patient should ask the doctor what warning signs to watch for.
- If the note is incomplete, do your best without inventing detail.

Return valid JSON only with this exact schema:
{
  "explanation": "string",
  "actions": ["string"],
  "warnings": ["string"],
  "questions": ["string"]
}
`;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function coerceResponse(value) {
  const record = value && typeof value === "object" ? value : {};
  const explanation =
    typeof record.explanation === "string" && record.explanation.trim()
      ? record.explanation.trim()
      : "We could not confidently simplify these notes. Please ask your care team to review the instructions with you.";

  const actions = normalizeStringArray(record.actions);
  const warnings = normalizeStringArray(record.warnings);
  const questions = normalizeStringArray(record.questions);

  return {
    explanation,
    actions,
    warnings:
      warnings.length > 0
        ? warnings
        : ["Ask your doctor what warning signs or symptoms should prompt a call or urgent care visit."],
    questions
  };
}

function parseOpenAIContent(content) {
  if (!content) {
    return coerceResponse(null);
  }

  try {
    return coerceResponse(JSON.parse(content));
  } catch {
    return coerceResponse(null);
  }
}

export async function OPTIONS() {
  return json(200, { ok: true });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return OPTIONS();
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return json(500, { error: "OPENAI_API_KEY is missing." });
  }

  try {
    const body = await request.json();
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return json(400, { error: "Please paste doctor notes or visit instructions first." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: notes }
        ]
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && payload.error && payload.error.message
          ? payload.error.message
          : "OpenAI request failed.";
      return json(response.status, { error: message });
    }

    const content = payload?.choices?.[0]?.message?.content || "";
    return json(200, parseOpenAIContent(content));
  } catch (error) {
    console.error("AfterVisit simplify error:", error);
    return json(500, { error: "Something went wrong while simplifying the instructions." });
  }
}
