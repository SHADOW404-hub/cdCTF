import { Link } from "wouter";
import { Trophy, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/LanguageContext";
import { useGetScoreboard, getGetScoreboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/AuthContext";
import { normalizeArray } from "@/lib/api-shapes";

export default function ScoreboardPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { data, isLoading } = useGetScoreboard({ limit: 100 }, {
    query: { queryKey: getGetScoreboardQueryKey({ limit: 100 }), refetchInterval: 30000 },
  });
  const entries = normalizeArray<any>(data?.entries, ["entries", "data", "items"]);
  const total = typeof data?.total === "number" ? data.total : entries.length;

  const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-orange-600"];

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t("Scoreboard", "Reyting", "Рейтинг")}</h1>
            <p className="text-sm text-muted-foreground">{data ? `${total} ${t("players", "o'yinchi", "игроков")}` : ""}</p>
          </div>
        </div>

        {data?.currentUserRank && (
          <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <p className="text-sm">
              {t("Your rank:", "Sizning reytingingiz:", "Ваш рейтинг:")} <span className="font-mono font-bold text-primary">#{data.currentUserRank}</span>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry, i) => {
              const isMe = user?.id === entry.userId;
              const rankColor = RANK_COLORS[i] ?? "text-muted-foreground";
              const titles = normalizeArray<string>(entry.titles, ["titles", "data", "items"]);
              return (
                <Link href={`/profile/${entry.userId}`} key={entry.userId}>
                  <div
                    className={`flex items-center gap-4 p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20"
                    }`}
                    data-testid={`row-scoreboard-${entry.userId}`}
                  >
                    <div className={`w-8 text-center font-mono font-bold text-sm ${rankColor}`}>
                      {entry.rank <= 3 ? <Medal className="w-4 h-4 mx-auto" /> : `#${entry.rank}`}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.nickname} className="w-9 h-9 rounded-full object-cover" />
                      ) : entry.nickname[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" data-testid={`text-nickname-${entry.userId}`}>{entry.nickname}</span>
                        {isMe && <span className="text-xs text-primary">(you)</span>}
                      </div>
                      <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        {titles.map(title => (
                          <span key={title} className="text-[10px] text-primary/70 font-mono bg-primary/5 px-1.5 py-0.5 rounded">{title}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono font-bold text-primary" data-testid={`text-points-${entry.userId}`}>{entry.points}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.solvedCtfCount} {t("CTFs", "CTF", "CTF")}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
