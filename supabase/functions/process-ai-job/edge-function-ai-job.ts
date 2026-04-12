// supabase/functions/process-ai-job/index.ts
// Edge Function — xử lý AI jobs bất đồng bộ
// Deploy: supabase functions deploy process-ai-job
// Trigger: pg_cron mỗi 1 phút, hoặc webhook từ admin UI

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // service role để bypass RLS
);

// ─── Lấy 1 job pending và xử lý ───
Deno.serve(async (req) => {
  try {
    // Lấy job pending cũ nhất
    const { data: job, error: fetchErr } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("status", "pending")
      .lt("attempt_count", supabase.rpc("max_attempts"))
      .order("created_at")
      .limit(1)
      .single();

    if (fetchErr || !job) {
      return new Response(JSON.stringify({ message: "No pending jobs" }), { status: 200 });
    }

    // Đánh dấu đang xử lý
    await supabase
      .from("ai_jobs")
      .update({ status: "processing", started_at: new Date().toISOString(), attempt_count: job.attempt_count + 1 })
      .eq("id", job.id);

    let result;
    if (job.job_type === "generate_words") {
      result = await generateWords(job);
    } else if (job.job_type === "generate_quiz") {
      result = await generateQuiz(job);
    } else {
      throw new Error(`Unknown job_type: ${job.job_type}`);
    }

    // Đánh dấu done
    await supabase
      .from("ai_jobs")
      .update({
        status:         "done",
        output_payload: result.output,
        tokens_used:    result.tokensUsed,
        cost_usd:       result.costUsd,
        completed_at:   new Date().toISOString(),
      })
      .eq("id", job.id);

    return new Response(JSON.stringify({ success: true, jobId: job.id }), { status: 200 });

  } catch (err) {
    console.error("AI job error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// ─── Generate Words bằng Claude ───
async function generateWords(job: Record<string, unknown>) {
  const input = job.input_payload as {
    count: number; difficulty: string; language: string; style: string;
  };

  // Lấy thông tin topic
  const { data: topic } = await supabase
    .from("topics")
    .select("title, description")
    .eq("id", job.topic_id)
    .single();

  const prompt = `Generate ${input.count} vocabulary words for the topic "${topic?.title}".
Description: ${topic?.description}
Difficulty: ${input.difficulty}
Source language: ${input.language}
Style: ${input.style}

Return ONLY valid JSON array with this exact structure:
[
  {
    "term": "word or phrase",
    "language": "source language",
    "definition": "clear, concise definition",
    "pronunciation": "/IPA notation/",
    "example_sentence": "natural example sentence using the word",
    "difficulty": "${input.difficulty}",
    "icon": "material_symbol_name"
  }
]

Rules:
- Definitions must be educational and accurate
- Example sentences must be natural and contextual
- Icons must be valid Material Symbols names
- No markdown, no explanation, ONLY the JSON array`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const claudeData = await response.json();
  const text       = claudeData.content[0].text;
  const words      = JSON.parse(text) as Record<string, string>[];

  // Insert words vào database
  const { error } = await supabase.from("words").insert(
    words.map((w) => ({
      topic_id:         job.topic_id,
      term:             w.term,
      language:         w.language,
      definition:       w.definition,
      pronunciation:    w.pronunciation,
      example_sentence: w.example_sentence,
      difficulty:       w.difficulty,
      icon:             w.icon ?? "translate",
      status:           "draft",  // Admin review trước khi publish
      ai_generated:     true,
      ai_model:         "claude-sonnet-4-20250514",
      ai_job_id:        job.id,
    }))
  );

  if (error) throw error;

  return {
    output:     { words_created: words.length },
    tokensUsed: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens,
    costUsd:    null,
  };
}

// ─── Generate Quiz Questions ───
async function generateQuiz(job: Record<string, unknown>) {
  const input = job.input_payload as { word_ids: string[] };

  const { data: words } = await supabase
    .from("words")
    .select("id, term, definition, example_sentence")
    .in("id", input.word_ids);

  const prompt = `Create multiple choice quiz questions for these vocabulary words.
Words: ${JSON.stringify(words)}

Return ONLY valid JSON array:
[
  {
    "word_id": "uuid",
    "question": "What does [word] mean?",
    "correct_answer": "the correct definition",
    "distractors": ["wrong option 1", "wrong option 2", "wrong option 3"]
  }
]

Rules:
- Distractors must be plausible but clearly wrong
- All options must be similar in length and style
- ONLY return the JSON array`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const claudeData = await response.json();
  const questions  = JSON.parse(claudeData.content[0].text);

  return {
    output:     { questions },
    tokensUsed: claudeData.usage?.input_tokens + claudeData.usage?.output_tokens,
    costUsd:    null,
  };
}
