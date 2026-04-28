// app/api/ai/route.ts
// API route xử lý tất cả AI features (dùng Anthropic Claude API)

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await req.json()
  const { action, payload } = body

  // Danh sách action hợp lệ
  const validActions = [
    "explain_word",       // Giải thích từ cho người dùng
    "suggest_topics",     // Gợi ý topic phù hợp
    "generate_vocab",     // Admin: tạo từ vựng
    "generate_quiz",      // Admin: tạo câu hỏi
    "chat",               // Chat học từ vựng
    "analyze_progress",   // Phân tích tiến độ học
  ]

  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Kiểm tra admin cho các action dành riêng cho admin
  const adminOnlyActions = ["generate_vocab", "generate_quiz"]
  if (adminOnlyActions.includes(action)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // Tạo system prompt theo action
  const systemPrompts: Record<string, string> = {
    explain_word: `Bạn là trợ lý học từ vựng thông minh. Khi được cho một từ, hãy:
1. Giải thích nghĩa rõ ràng bằng tiếng Việt
2. Đưa ra 2-3 ví dụ câu tự nhiên
3. Giải thích nguồn gốc từ nếu thú vị
4. Gợi ý từ đồng nghĩa/trái nghĩa
Trả lời ngắn gọn, dễ hiểu, thân thiện.`,

    suggest_topics: `Bạn là cố vấn học ngoại ngữ. Dựa trên lịch sử học của người dùng, hãy gợi ý 3 topic tiếp theo phù hợp nhất. Giải thích ngắn gọn tại sao mỗi topic phù hợp.`,

    generate_vocab: `Bạn là chuyên gia ngôn ngữ. Tạo danh sách từ vựng theo topic được yêu cầu.
QUAN TRỌNG: Trả về JSON THUẦN TÚY (không có markdown), đúng format:
{
  "words": [
    {
      "word": "tên từ",
      "language": "English/French/German/Spanish/...",
      "definition": "định nghĩa tiếng Anh",
      "example_sentence": "Câu ví dụ bằng ngôn ngữ của từ đó",
      "icon": "một emoji phù hợp",
      "pronunciation": "phiên âm IPA (nếu có)",
      "difficulty": "beginner/intermediate/advanced"
    }
  ]
}
Tạo đúng số lượng được yêu cầu, từ ngữ chính xác và thực tế.`,

    generate_quiz: `Bạn là chuyên gia ra đề thi. Tạo câu hỏi trắc nghiệm từ danh sách từ vựng.
QUAN TRỌNG: Trả về JSON THUẦN TÚY, đúng format:
{
  "questions": [
    {
      "question": "câu hỏi",
      "correct_answer": "đáp án đúng",
      "options": ["đáp án A", "đáp án B", "đáp án C", "đáp án D"],
      "explanation": "giải thích ngắn gọn"
    }
  ]
}
Đảm bảo options có đúng 4 lựa chọn, correct_answer nằm trong options, các đáp án sai cũng phải hợp lý.`,

    chat: `Bạn là gia sư học từ vựng thân thiện. Trò chuyện bằng tiếng Việt, giúp người dùng học từ vựng qua đối thoại. Có thể hỏi người dùng về nghĩa của từ, tạo câu ví dụ, hoặc giải thích khi cần. Giữ tông vui vẻ, khuyến khích.`,

    analyze_progress: `Bạn là chuyên gia phân tích học tập. Dựa trên dữ liệu tiến độ, đưa ra:
1. Nhận xét tổng quan
2. Điểm mạnh/yếu
3. Gợi ý cụ thể để cải thiện
Viết bằng tiếng Việt, thân thiện và động viên.`,
  }

  // Tạo user message theo action
  let userMessage = ""
  switch (action) {
    case "explain_word":
      userMessage = `Giải thích từ "${payload.word}" (${payload.language || "English"})`
      break
    case "suggest_topics":
      userMessage = `Người dùng đã học: ${payload.learned_topics?.join(", ")}. Gợi ý topic tiếp theo.`
      break
    case "generate_vocab":
      userMessage = `Tạo ${payload.count || 10} từ vựng về chủ đề "${payload.topic}" bằng ${payload.language || "English"}. Độ khó: ${payload.difficulty || "beginner"}.`
      break
    case "generate_quiz":
      userMessage = `Tạo ${payload.count || 5} câu hỏi trắc nghiệm từ danh sách từ sau:\n${JSON.stringify(payload.words, null, 2)}`
      break
    case "chat":
      userMessage = payload.message
      break
    case "analyze_progress":
      userMessage = `Phân tích tiến độ học: ${JSON.stringify(payload.stats)}`
      break
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompts[action],
        messages: [
          ...(payload.history || []),
          { role: "user", content: userMessage },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error("Claude API error:", err)
      return NextResponse.json({ error: "AI service error" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content[0]?.text || ""

    // Log usage
    if (user) {
      await supabase.from("ai_usage_logs").insert({
        user_id: user.id,
        action_type: action,
        input_tokens: data.usage?.input_tokens || 0,
        output_tokens: data.usage?.output_tokens || 0,
        topic_slug: payload.topic_slug,
      })
    }

    // Parse JSON nếu action cần
    if (action === "generate_vocab" || action === "generate_quiz") {
      try {
        const clean = text.replace(/```json|```/g, "").trim()
        const parsed = JSON.parse(clean)
        return NextResponse.json({ result: parsed, raw: text })
      } catch {
        return NextResponse.json({ result: null, raw: text })
      }
    }

    return NextResponse.json({ result: text })
  } catch (error) {
    console.error("AI route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
