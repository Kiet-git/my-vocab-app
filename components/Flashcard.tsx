type Variant = "primary" | "secondary" | "tertiary";

interface FlashcardProps {
  word: string;
  language: string;
  definition: string;
  example: string;
  icon: string;
  variant?: Variant;
  isMastered?: boolean;
}

const S: Record<Variant, { icon: string; lang: string; border: string; audio: string }> = {
  primary:   { icon: "opacity-40 text-primary",   lang: "text-primary",   border: "border-primary/15",   audio: "text-primary" },
  secondary: { icon: "opacity-40 text-secondary", lang: "text-secondary", border: "border-secondary/15", audio: "text-secondary" },
  tertiary:  { icon: "opacity-40 text-tertiary",  lang: "text-tertiary",  border: "border-tertiary/15",  audio: "text-tertiary" },
};

export default function Flashcard({ word, language, definition, example, icon, variant = "primary", isMastered = false }: FlashcardProps) {
  const s = S[variant];
  return (
    <div className="card-scene h-[280px]">
      <div className="card-inner">
        {/* Front */}
        <div className="card-face glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 shadow-xl shadow-surface-container/40">
          {isMastered && (
            <div className="absolute top-5 right-5">
              <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
          )}
          <span className={`material-symbols-outlined text-4xl mb-4 ${s.icon}`} style={{ fontSize: "36px" }}>{icon}</span>
          <h3 className="text-2xl md:text-3xl font-headline font-bold text-on-surface text-center leading-tight">{word}</h3>
          <p className={`mt-3 text-xs font-bold tracking-[0.2em] uppercase ${s.lang}`}>{language}</p>
        </div>
        {/* Back */}
        <div className={`card-face card-face-back bg-surface-container-lowest rounded-[2rem] flex flex-col items-center justify-center p-8 border-2 ${s.border} shadow-2xl`}>
          <p className="text-on-surface font-medium text-base md:text-lg text-center leading-relaxed italic">
            &ldquo;{definition}&rdquo;
          </p>
          {example && (
            <div className="mt-5 w-full pt-5 border-t border-outline-variant/20">
              <p className="text-on-surface-variant text-sm text-center leading-relaxed">{example}</p>
            </div>
          )}
          {isMastered && (
            <div className="absolute bottom-5 left-6">
              <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase">Mastered</span>
            </div>
          )}
          <div className={`absolute bottom-5 right-6 ${s.audio}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
          </div>
        </div>
      </div>
    </div>
  );
}
