"use client";
import { useState } from "react";
import { Volume2, RefreshCw } from "lucide-react";

export default function Flashcard({ word }: { word: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative h-80 w-full cursor-pointer group [perspective:1000px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] relative ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
      >
        {/* MẶT TRƯỚC (Tiếng Anh - Trắng) */}
        <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow border border-slate-100 flex flex-col items-center justify-center p-8 text-center [backface-visibility:hidden]">
          <Volume2 className="absolute top-6 right-6 w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors" />

          <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            {word.word}
          </h3>
          {word.pronunciation && (
            <p className="text-indigo-500 font-medium mt-3 text-xl bg-indigo-50 px-4 py-1 rounded-full">
              /{word.pronunciation}/
            </p>
          )}
          <div className="absolute bottom-6 flex items-center gap-2 text-sm text-slate-400 font-medium">
            <RefreshCw className="w-4 h-4" /> Bấm để lật thẻ
          </div>
        </div>

        {/* MẶT SAU (Tiếng Việt - Nền Gradient) */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-cyan-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <h3 className="text-3xl font-bold mb-4">{word.meaning}</h3>

          {word.example_sentence && (
            <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
              <p className="text-white/90 italic text-lg text-pretty">
                "{word.example_sentence}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
