import { useRoute, Link } from "wouter";
import { Trophy, Flag, BookOpen, Target, Calendar, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/LanguageContext";
import { useGetUserProfile, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const id = Number(params?.id);
  const { t } = useLang();
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading } = useGetUserProfile(id, {
    query: { enabled: !!id, queryKey: getGetUserProfileQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pt-14 flex items-center justify-center">
        <p className="text-muted-foreground">{t("User not found", "Foydalanuvchi topilmadi", "Пользователь не найден")}</p>
      </div>
    );
  }

  const isOwn = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" data-testid="img-avatar" />
            ) : (
              profile.nickname[0].toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-nickname">{profile.nickname}</h1>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono font-bold text-primary text-lg" data-testid="text-points">{profile.points} pts</span>
                  <span className="text-sm text-muted-foreground">#{profile.rank} {t("rank", "reyting", "место")}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {isOwn && (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" data-testid="button-edit-profile">{t("Edit Profile", "Profilni Tahrirlash", "Редактировать")}</Button>
                </Link>
              )}
            </div>

            {/* Titles */}
            {profile.titles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.titles.map(title => (
                  <span key={title.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium" data-testid={`badge-title-${title.id}`}>
                    <Star className="w-2.5 h-2.5" /> {title.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border bg-card text-center" data-testid="stat-solved-ctf">
            <div className="text-2xl font-mono font-bold text-primary">{profile.solvedCtf.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("CTFs Solved", "CTF Yechilgan", "CTF решено")}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center" data-testid="stat-completed-lessons">
            <div className="text-2xl font-mono font-bold text-primary">{profile.completedLessons.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("Lessons Done", "Darslar Tugatilgan", "Уроков завершено")}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center" data-testid="stat-competitions">
            <div className="text-2xl font-mono font-bold text-primary">{profile.competitionHistory.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("Competitions", "Musobaqalar", "Соревнований")}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Solved CTF */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4" /> {t("Solved Challenges", "Yechilgan Topshiriqlar", "Решённые задания")}
            </h2>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {profile.solvedCtf.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("No challenges solved yet", "Topshiriqlar yechilmagan", "Нет решённых заданий")}</p>
              ) : profile.solvedCtf.map(ctf => (
                <div key={ctf.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card text-sm" data-testid={`row-solved-ctf-${ctf.id}`}>
                  <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="flex-1 truncate">{ctf.name}</span>
                  <span className="text-xs text-muted-foreground">{ctf.category}</span>
                  <span className="font-mono text-xs text-primary font-bold">+{ctf.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Lessons */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> {t("Completed Lessons", "Tugatilgan Darslar", "Завершённые уроки")}
            </h2>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {profile.completedLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("No lessons completed yet", "Darslar tugatilmagan", "Нет завершённых уроков")}</p>
              ) : profile.completedLessons.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card text-sm" data-testid={`row-completed-lesson-${lesson.id}`}>
                  <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="flex-1 truncate">{lesson.title}</span>
                  <span className="font-mono text-xs text-primary font-bold">+{lesson.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competition History */}
          {profile.competitionHistory.length > 0 && (
            <div className="md:col-span-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> {t("Competition History", "Musobaqa Tarixi", "История соревнований")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {profile.competitionHistory.map(comp => (
                  <div key={comp.competitionId} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm" data-testid={`row-comp-history-${comp.competitionId}`}>
                    <span className="truncate font-medium">{comp.competitionName}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-muted-foreground text-xs">#{comp.rank}</span>
                      <span className="font-mono text-xs text-primary font-bold">{comp.points}pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
