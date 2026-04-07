import { supabase } from "@/lib/supabase";
import Flashcard from "@/components/Flashcard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (topicError || !topic) {
    return (
      <div className="p-10 text-center font-bold text-2xl">
        Không tìm thấy chủ đề này!
      </div>
    );
  }

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("topic_id", topic.id);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <main className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-full shadow-sm hover:shadow-md hover:text-indigo-600 transition-all font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
            Chủ đề: <span className="text-indigo-600">{topic.title}</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Bạn có {words?.length || 0} từ vựng cần ôn tập trong chủ đề này.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {words && words.length > 0 ? (
            words.map((word) => <Flashcard key={word.id} word={word} />)
          ) : (
            <p className="text-slate-500 col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              Chưa có từ vựng nào. Hãy thêm vào Supabase nhé!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
