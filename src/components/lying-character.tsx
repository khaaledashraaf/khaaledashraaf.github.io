export function LyingCharacter({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end justify-center pointer-events-none ${className}`}>
      <video
        src="/animations/character-lying-on-grass.webm"
        autoPlay
        loop
        muted
        playsInline
        className="w-64 md:w-80 dark:invert opacity-80"
      />
    </div>
  );
}
