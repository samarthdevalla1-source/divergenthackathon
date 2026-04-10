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

function sendJson(response, status, body) {
  response.status(status).json(body);
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

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (request.method === "OPTIONS") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return sendJson(response, 500, { error: "OPENAI_API_KEY is missing." });
  }

  try {
    const body = request.body && typeof request.body === "object" ? request.body : {};
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return sendJson(response, 400, { error: "Please paste doctor notes or visit instructions first." });
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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

    const payload = await openAIResponse.json();

    if (!openAIResponse.ok) {
      const message =
        payload && typeof payload === "object" && payload.error && payload.error.message
          ? payload.error.message
          : "OpenAI request failed.";
      return sendJson(response, openAIResponse.status, { error: message });
    }

    const content = payload?.choices?.[0]?.message?.content || "";
    return sendJson(response, 200, parseOpenAIContent(content));
  } catch (error) {
    console.error("AfterVisit simplify error:", error);
    return sendJson(response, 500, { error: "Something went wrong while simplifying the instructions." });
  }
}
