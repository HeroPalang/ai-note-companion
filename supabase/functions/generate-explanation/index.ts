import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type QuizItem = {
  question: string;
  choices: string[];
  answer: string;
};

const TOKEN_WINDOW_HOURS = 24;
const TOKEN_LIMIT = 50_000;

function parseModelJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Handle responses wrapped in markdown code fences or extra text.
    const fenced = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(fenced);
    } catch {
      const start = fenced.indexOf("{");
      const end = fenced.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(fenced.slice(start, end + 1));
      }
      throw new Error("Model response was not valid JSON.");
    }
  }
}

function cleanQuiz(raw: unknown, count: number): QuizItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, Math.max(1, Math.min(count, 10)))
    .map((item) => {
      const row = (item && typeof item === "object") ? item as Record<string, unknown> : {};
      const question = typeof row.question === "string" ? row.question.trim() : "";
      const choices = Array.isArray(row.choices)
        ? row.choices.map((c) => String(c)).filter(Boolean).slice(0, 6)
        : [];
      const answer = typeof row.answer === "string" ? row.answer.trim() : "";
      return { question, choices, answer };
    })
    .filter((q) => q.question && q.choices.length >= 2 && q.answer);
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function estimateTokens(text: string): number {
  // Coarse fallback when provider usage metadata is missing.
  return Math.max(1, Math.ceil(text.length / 4));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY in Supabase Edge Function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = await req.json().catch(() => ({}));

    let userId = "";
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (jwt) {
      const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
      if (!authError && authData?.user?.id) {
        userId = authData.user.id;
      }
    }

    if (!userId) {
      const candidate = String(body?.userId || "").trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) {
        userId = candidate;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized request." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const windowStartIso = new Date(Date.now() - TOKEN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data: usageRows, error: usageError } = await supabase
      .from("ai_token_usage")
      .select("total_tokens")
      .eq("user_id", userId)
      .gte("created_at", windowStartIso);

    if (usageError) {
      return new Response(
        JSON.stringify({ error: `Usage check failed: ${usageError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const usedTokens = (usageRows || []).reduce((sum, row) => sum + toNumber((row as Record<string, unknown>)?.total_tokens), 0);
    if (usedTokens >= TOKEN_LIMIT) {
      return new Response(
        JSON.stringify({
          error: `Token limit reached. Max ${TOKEN_LIMIT.toLocaleString()} tokens per day.`,
          limit: TOKEN_LIMIT,
          windowHours: TOKEN_WINDOW_HOURS,
          used: usedTokens,
          remaining: Math.max(0, TOKEN_LIMIT - usedTokens),
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const title = String(body?.title || "").trim();
    const subject = String(body?.subject || "").trim();
    const content = String(body?.content || "").trim();
    const difficulty = String(body?.difficulty || "medium").toLowerCase();
    const questionCount = Math.max(3, Math.min(Number(body?.questionCount || 5), 10));
    const generateType = String(body?.generateType || "explanation").toLowerCase();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetLabel = generateType === "questions" ? "a quiz" : "a concise student-friendly explanation";
    const prompt = `
Generate ${targetLabel} from these notes.

Title: ${title || "Untitled"}
Subject: ${subject || "General"}
Difficulty: ${difficulty}
Questions: ${questionCount}
Output Type: ${generateType}

Notes:
${content}
`.trim();

    const instructionText = generateType === "questions"
      ? "Return only valid JSON with keys: explanation (string), quiz (array). For questions mode, set explanation to an empty string and return quiz with requested number of items. Quiz items must include question (string), choices (array of 4 strings), answer (string matching one choice)."
      : "Return only valid JSON with keys: explanation (string), quiz (array). For explanation mode, provide explanation and set quiz to an empty array.";

    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: instructionText,
            },
          ],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    const raw = await geminiResponse.json();
    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: raw?.error?.message || "Gemini request failed." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contentText = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof contentText !== "string" || !contentText.trim()) {
      return new Response(
        JSON.stringify({ error: "Gemini did not return text content." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseModelJson(contentText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid model JSON.";
      return new Response(
        JSON.stringify({ error: `Gemini output parse failed: ${msg}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const explanation = String(parsed?.explanation || "").trim();
    const quiz = cleanQuiz(parsed?.quiz, questionCount);
    const usage = (raw && typeof raw === "object")
      ? (raw as Record<string, unknown>)?.usageMetadata as Record<string, unknown> | undefined
      : undefined;
    const promptTokens = toNumber(usage?.promptTokenCount) || estimateTokens(prompt);
    const completionTokens = toNumber(usage?.candidatesTokenCount) || estimateTokens(contentText);
    const totalTokens = toNumber(usage?.totalTokenCount) || (promptTokens + completionTokens);

    if (generateType === "explanation" && !explanation) {
      return new Response(
        JSON.stringify({ error: "Model did not return explanation." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (generateType === "questions" && quiz.length === 0) {
      return new Response(
        JSON.stringify({ error: "Model did not return quiz." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: logError } = await supabase
      .from("ai_token_usage")
      .insert({
        user_id: userId,
        model: "gemini-2.5-flash-lite",
        generate_type: generateType,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      });

    if (logError) {
      return new Response(
        JSON.stringify({ error: `Usage logging failed: ${logError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newUsedTokens = usedTokens + totalTokens;
    const remainingTokens = Math.max(0, TOKEN_LIMIT - newUsedTokens);

    return new Response(
      JSON.stringify({
        explanation,
        quiz,
        usage: {
          usedInWindow: newUsedTokens,
          remainingInWindow: remainingTokens,
          limit: TOKEN_LIMIT,
          windowHours: TOKEN_WINDOW_HOURS,
          requestTotalTokens: totalTokens,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
