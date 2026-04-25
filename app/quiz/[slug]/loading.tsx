export default function QuizLoading() {
  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-6 space-y-8">
        <div className="skeleton h-4 w-48 mx-auto" />
        <div className="skeleton h-52 rounded-[2rem]" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
        <div className="skeleton h-14 rounded-xl" />
      </div>
    </div>
  );
}
