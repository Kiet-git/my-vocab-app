import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Bật chế độ tự động cập nhật dữ liệu mới mỗi khi load lại trang
export const revalidate = 0;

export default async function Home() {
  // Lấy toàn bộ chủ đề từ Supabase
  const { data: topics, error } = await supabase.from("topics").select("*");

  if (error)
    return <p className="text-center mt-10 text-red-500">Lỗi tải dữ liệu!</p>;
  if (!topics || topics.length === 0)
    return (
      <p className="text-center mt-10">
        Chưa có chủ đề nào. Hãy vào Supabase thêm nhé!
      </p>
    );

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-slate-800">
        📚 Chọn chủ đề để học
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <Link href={`/topic/${topic.slug}`} key={topic.id}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl text-blue-600">
                  {topic.title}
                </CardTitle>
                <CardDescription>Bấm vào để bắt đầu học →</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
