import OpenAI from "openai";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { coerceSimplifyResponse, type SimplifyResponse } from "@/lib/types";

export const runtime = "nodejs";

function parseStructuredResponse(rawContent: string | null | undefined): SimplifyResponse {
  if (!rawContent) {
    return coerceSimplifyResponse(null);
  }

  try {
    return coerceSimplifyResponse(JSON.parse(rawContent));
  } catch {
    return coerceSimplifyResponse(null);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "The OpenAI API key is missing. Add OPENAI_API_KEY to your environment variables."
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { notes?: unknown };
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return NextResponse.json(
        {
          error: "Please paste the doctor notes or after-visit instructions first."
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: notes
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = parseStructuredResponse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error simplifying after-visit notes:", error);

    return NextResponse.json(
      {
        error: "We could not simplify those instructions right now. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}
