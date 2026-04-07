import { supabase } from "@/lib/supabase";
import Flashcard from "@/components/Flashcard";
import Link from "next/link";

// Ép web luôn lấy dữ liệu mới nhất, không dùng bản lưu cũ (cache)
export const revalidate = 0;

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 1. Chờ lấy slug từ URL
  const { slug } = await params;

  // 2. Tìm ID của chủ đề dựa trên slug
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (topicError || !topic) {
    return <div className="p-10 text-center">Không tìm thấy chủ đề này!</div>;
  }

  // 3. Lấy các từ vựng thuộc chủ đề đó
  const { data: words, error: wordsError } = await supabase
    .from("words")
    .select("*")
    .eq("topic_id", topic.id); // Lọc đúng từ vựng của chủ đề này

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-6 inline-block"
      >
        ← Quay lại trang chủ
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-slate-800">
        Chủ đề: {topic.title} ({words?.length || 0} từ)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {words && words.length > 0 ? (
          words.map((word) => <Flashcard key={word.id} word={word} />)
        ) : (
          <p className="text-slate-500">
            Chưa có từ vựng nào. Hãy thêm vào Supabase nhé!
          </p>
        )}
      </div>
    </main>
  );
}
