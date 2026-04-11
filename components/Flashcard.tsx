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

const styles: Record<Variant, { icon: string; lang: string; border: string; audio: string }> = {
  primary:   { icon: "text-primary/40",   lang: "text-primary",   border: "border-primary/10",   audio: "text-primary" },
  secondary: { icon: "text-secondary/40", lang: "text-secondary", border: "border-secondary/10", audio: "text-secondary" },
  tertiary:  { icon: "text-tertiary/40",  lang: "text-tertiary",  border: "border-tertiary/10",  audio: "text-tertiary" },
};

export default function Flashcard({
  word, language, definition, example, icon,
  variant = "primary", isMastered = false,
}: FlashcardProps) {
  const s = styles[variant];
  return (
    <div className="group h-[280px] perspective-1000">
      <div className="relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">

        {/* ── FRONT ── */}
        <div className="absolute inset-0 glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 [backface-visibility:hidden] shadow-xl shadow-surface-container/50">
          {isMastered && (
            <div className="absolute top-6 right-6">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
            </div>
          )}
          <span className={`material-symbols-outlined ${s.icon} text-4xl mb-4`}>{icon}</span>
          <h3 className="text-3xl font-headline font-bold text-on-surface text-center">{word}</h3>
          <p className={`mt-4 text-xs font-bold ${s.lang} tracking-[0.2em] uppercase`}>{language}</p>
        </div>

        {/* ── BACK ── */}
        <div className={`absolute inset-0 bg-surface-container-lowest rounded-[2rem] flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] border-2 ${s.border} shadow-2xl`}>
          <p className="text-on-surface font-medium text-lg text-center leading-relaxed italic">
            &ldquo;{definition}&rdquo;
          </p>
          <div className="mt-6 w-full pt-6 border-t border-outline-variant/20">
            <p className="text-on-surface-variant text-sm text-center">Example: {example}</p>
          </div>
          {isMastered && (
            <div className="absolute bottom-6 left-8">
              <span className="px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase">
                Mastered
              </span>
            </div>
          )}
          <div className={`absolute bottom-6 right-8 ${s.audio}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
