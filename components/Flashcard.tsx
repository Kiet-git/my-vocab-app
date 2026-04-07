"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";

export default function Flashcard({ word }: { word: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="cursor-pointer h-64"
    >
      <Card className="h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-xl transition-all border-slate-200">
        {!isFlipped ? (
          <>
            <h3 className="text-3xl font-bold text-slate-800">{word.word}</h3>
            {word.pronunciation && (
              <p className="text-slate-500 mt-2 text-lg">
                /{word.pronunciation}/
              </p>
            )}
            <p className="text-sm mt-6 text-slate-400 border-t pt-2 w-full">
              👆 Bấm để xem nghĩa
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-emerald-600">
              {word.meaning}
            </h3>
            {word.example_sentence && (
              <p className="text-slate-600 mt-4 italic">
                "{word.example_sentence}"
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
