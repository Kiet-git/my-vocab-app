import { supabase } from "@/lib/supabase";
import Flashcard from "@/components/Flashcard";
import Link from "next/link";

export const revalidate = 0;

export default async function TopicPage({
  params,
}: {
  params: { slug: string };
}) {
  // 1. Tìm chủ đề dựa vào URL (slug)
  const { data: topic } = await supabase
    .from("topics")
    .select("id, title")
    .eq("slug", params.slug)
    .single();

  if (!topic)
    return <p className="text-center mt-10">Không tìm thấy chủ đề!</p>;

  // 2. Lấy các từ vựng thuộc chủ đề này
  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("topic_id", topic.id);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-blue-500 hover:underline mb-6 inline-block"
      >
        ← Quay lại trang chủ
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-slate-800">
        Chủ đề: {topic.title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {words?.map((word) => (
          <Flashcard key={word.id} word={word} />
        ))}
      </div>

      {(!words || words.length === 0) && (
        <p className="text-center text-slate-500">
          Chưa có từ vựng nào trong chủ đề này.
        </p>
      )}
    </main>
  );
}
