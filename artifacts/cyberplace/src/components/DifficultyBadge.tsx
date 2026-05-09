interface DifficultyBadgeProps {
  difficulty: string;
  className?: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  insane: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function DifficultyBadge({ difficulty, className = "" }: DifficultyBadgeProps) {
  const style = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.easy;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono uppercase font-medium ${style} ${className}`}>
      {difficulty}
    </span>
  );
}
