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

const S: Record<
  Variant,
  {
    iconColor: string;
    langColor: string;
    border: string;
    audioColor: string;
    masteredBg: string;
    masteredText: string;
  }
> = {
  primary: {
    iconColor: "text-primary opacity-40",
    langColor: "text-primary",
    border: "border-primary/10",
    audioColor: "text-primary",
    masteredBg: "bg-primary-container",
    masteredText: "text-on-primary-container",
  },
  secondary: {
    iconColor: "text-secondary opacity-40",
    langColor: "text-secondary",
    border: "border-secondary/10",
    audioColor: "text-secondary",
    masteredBg: "bg-secondary-container",
    masteredText: "text-on-secondary-container",
  },
  tertiary: {
    iconColor: "text-tertiary opacity-40",
    langColor: "text-tertiary",
    border: "border-tertiary/10",
    audioColor: "text-tertiary",
    masteredBg: "bg-tertiary-container",
    masteredText: "text-on-tertiary-container",
  },
};

export default function Flashcard({
  word,
  language,
  definition,
  example,
  icon,
  variant = "primary",
  isMastered = false,
}: FlashcardProps) {
  const s = S[variant];

  return (
    <div className="card-scene h-[280px]">
      <div className="card-inner">
        {/* ── FRONT ── */}
        <div className="card-face glass-card rounded-[2rem] flex flex-col items-center justify-center p-8 shadow-xl shadow-surface-container/50">
          {isMastered && (
            <div className="absolute top-6 right-6">
              <span
                className="material-symbols-outlined text-tertiary"
                style={{
                  fontVariationSettings:
                    "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                stars
              </span>
            </div>
          )}
          <span
            className={`material-symbols-outlined text-4xl mb-4 ${s.iconColor}`}
            style={{ fontSize: "36px" }}
          >
            {icon}
          </span>
          <h3 className="text-3xl font-headline font-bold text-on-surface text-center">
            {word}
          </h3>
          <p
            className={`mt-4 text-xs font-bold tracking-[0.2em] uppercase ${s.langColor}`}
          >
            {language}
          </p>
        </div>

        {/* ── BACK ── */}
        <div
          className={`card-face card-face-back bg-surface-container-lowest rounded-[2rem] flex flex-col items-center justify-center p-8 border-2 ${s.border} shadow-2xl`}
        >
          <p className="text-on-surface font-medium text-lg text-center leading-relaxed italic">
            &ldquo;{definition}&rdquo;
          </p>
          <div className="mt-6 w-full pt-6 border-t border-outline-variant/20">
            <p className="text-on-surface-variant text-sm text-center">
              Example: {example}
            </p>
          </div>

          {isMastered && (
            <div className="absolute bottom-6 left-8">
              <span
                className={`px-2 py-0.5 rounded ${s.masteredBg} ${s.masteredText} text-[10px] font-bold uppercase`}
              >
                Mastered
              </span>
            </div>
          )}

          <div className={`absolute bottom-6 right-8 ${s.audioColor}`}>
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings:
                  "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              volume_up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
