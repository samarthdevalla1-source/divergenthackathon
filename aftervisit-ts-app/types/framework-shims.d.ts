declare module "*.css" {
  const content: string;
  export default content;
}

declare module "next" {
  export type Metadata = {
    title?: string;
    description?: string;
  };
}

declare module "next/server" {
  export class NextResponse {
    static json(body: unknown, init?: { status?: number }): Response;
  }
}

declare module "next/font/google" {
  type FontOptions = {
    subsets?: string[];
    variable?: string;
    weight?: string[];
  };

  type FontResult = {
    variable: string;
    className: string;
  };

  export function Manrope(options: FontOptions): FontResult;
  export function IBM_Plex_Mono(options: FontOptions): FontResult;
}

declare module "openai" {
  type ChatCompletionResponse = {
    choices: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  type ChatCompletionRequest = {
    model: string;
    temperature?: number;
    response_format?: {
      type: "json_object";
    };
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
  };

  export default class OpenAI {
    constructor(options: { apiKey: string });

    chat: {
      completions: {
        create(input: ChatCompletionRequest): Promise<ChatCompletionResponse>;
      };
    };
  }
}

declare module "tailwindcss" {
  export type Config = {
    content?: string[];
    theme?: {
      extend?: Record<string, unknown>;
    };
    plugins?: unknown[];
  };
}

declare const process: {
  env: Record<string, string | undefined>;
};
