import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sparkles, BookOpen } from "lucide-react";

export const revalidate = 0;

export default async function Home() {
  const { data: topics, error } = await supabase.from("topics").select("*");

  if (error)
    return <p className="text-center mt-10 text-red-500">Lỗi tải dữ liệu!</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-16 px-4">
      <main className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-indigo-500" />
            Từ Vựng Siêu Tốc
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Chọn một chủ đề bên dưới và bắt đầu hành trình chinh phục tiếng Anh!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topics?.map((topic) => (
            <Link href={`/topic/${topic.slug}`} key={topic.id}>
              <Card className="group relative overflow-hidden bg-white/70 backdrop-blur-lg border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl cursor-pointer">
                {/* Hiệu ứng thanh màu trang trí ở trên cùng của thẻ */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="p-8">
                  <BookOpen className="w-8 h-8 text-indigo-400 mb-4 group-hover:text-indigo-600 transition-colors" />
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-base mt-2">
                    Bấm vào để học ngay →
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
