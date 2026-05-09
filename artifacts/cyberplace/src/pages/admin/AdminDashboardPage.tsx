import { Users, Flag, BookOpen, Trophy, AlertTriangle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useLang } from "@/lib/LanguageContext";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { normalizeArray } from "@/lib/api-shapes";

export default function AdminDashboardPage() {
  const { t } = useLang();
  const { data, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });
  const mostSolvedCtf = normalizeArray<any>(data?.mostSolvedCtf, ["mostSolvedCtf", "ctf", "data", "items"]);
  const mostActiveUsers = normalizeArray<any>(data?.mostActiveUsers, ["mostActiveUsers", "users", "data", "items"]);

  const stats = data ? [
    { icon: Users, label: t("Total Users", "Jami Foydalanuvchilar", "Всего пользователей"), value: data.totalUsers, sub: `${data.activeUsers} ${t("active", "faol", "активных")}` },
    { icon: Flag, label: t("CTF Challenges", "CTF Topshiriqlari", "CTF Заданий"), value: data.totalCtf },
    { icon: BookOpen, label: t("Lessons", "Darslar", "Уроков"), value: data.totalLessons },
    { icon: Trophy, label: t("Competitions", "Musobaqalar", "Соревнований"), value: data.totalCompetitions },
    { icon: TrendingUp, label: t("Avg Test Score", "O'rtacha Test", "Ср. балл теста"), value: `${Math.round(data.averageTestResult * 100)}%` },
    { icon: AlertTriangle, label: t("Blocked Tasks", "Bloklangan", "Заблокировано"), value: data.blockedTasksCount, danger: true },
  ] : [];

  return (
    <div className="flex min-h-screen bg-background pt-14">
      <AdminSidebar />
      <main className="flex-1 p-6 max-w-5xl">
        <h1 className="text-xl font-bold mb-6">{t("Dashboard", "Boshqaruv Paneli", "Панель управления")}</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`p-4 rounded-xl border bg-card ${s.danger ? "border-destructive/30" : "border-border"}`} data-testid={`stat-card-${i}`}>
                  <Icon className={`w-4 h-4 mb-2 ${s.danger ? "text-destructive" : "text-primary"}`} />
                  <div className={`text-2xl font-mono font-bold ${s.danger ? "text-destructive" : "text-primary"}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
                </div>
              );
            })}
          </div>
        )}

        {data && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Most Solved CTF */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("Most Solved CTFs", "Ko'p Yechilgan CTFlar", "Самые решаемые CTF")}</h2>
              <div className="space-y-1.5">
                {mostSolvedCtf.map((ctf, i) => (
                  <div key={ctf.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm" data-testid={`row-most-solved-${ctf.id}`}>
                    <span className="w-5 font-mono text-muted-foreground text-xs">#{i + 1}</span>
                    <span className="flex-1 truncate">{ctf.name}</span>
                    <span className="font-mono text-xs text-primary">{ctf.solvedCount} {t("solves", "yechim", "решений")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Active Users */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("Most Active Users", "Faol Foydalanuvchilar", "Самые активные")}</h2>
              <div className="space-y-1.5">
                {mostActiveUsers.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-sm" data-testid={`row-active-user-${u.id}`}>
                    <span className="w-5 font-mono text-muted-foreground text-xs">#{i + 1}</span>
                    <span className="flex-1 truncate font-medium">{u.nickname}</span>
                    <span className="font-mono text-xs text-primary">{u.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
