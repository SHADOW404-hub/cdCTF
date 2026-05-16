import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Shield, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/LanguageContext";
import { FadeIn, ScaleIn } from "@/components/PageTransition";
import { motion } from "framer-motion";

const schema = z.object({
  nickname: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLang();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nickname: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.user as Parameters<typeof login>[0], res.token);
          if (res.user.role === "admin") {
            setLocation("/admin/dashboard");
          } else {
            setLocation("/ctf");
          }
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? t("Invalid credentials", "Noto'g'ri ma'lumotlar", "Неверные данные");
          toast({ title: t("Login failed", "Kirish muvaffaqiyatsiz", "Ошибка входа"), description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 mono-grid opacity-10 pointer-events-none" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[30%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <ScaleIn>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 mb-8 animate-float shadow-2xl backdrop-blur-md">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-4">{t("AUTHENTICATE", "KIRISH", "АУТЕНТИФИКАЦИЯ")}</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">{t("SECURE GATEWAY_01 // ACCESS REQUIRED", "XAVFSIZLIK DARVOZASI_01 // RUXSAT KERAK", "ЗАЩИЩЕННЫЙ ШЛЮЗ_01")}</p>
          </div>
        </ScaleIn>

        <FadeIn delay={0.2}>
          <div className="glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField control={form.control} name="nickname" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">{t("OPERATIVE_ID", "TAXALLUS", "НИКНЕЙМ")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <input 
                          {...field} 
                          placeholder="your_nickname" 
                          data-testid="input-nickname" 
                          autoComplete="username" 
                          className="w-full pl-12 pr-6 h-14 bg-white/5 border border-white/5 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm tracking-wide placeholder:text-muted-foreground/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase mt-2 ml-1" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between ml-1 mb-2">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t("ACCESS_KEY", "PAROL", "ПАРОЛЬ")}</FormLabel>
                      <Link href="/forgot-password" className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-accent transition-colors">
                        {t("LOST_KEY?", "UNUTDINGIZMI?", "ЗАБЫЛИ ПАРОЛЬ?")}
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <input 
                          {...field} 
                          type="password" 
                          placeholder="••••••••" 
                          data-testid="input-password" 
                          autoComplete="current-password" 
                          className="w-full pl-12 pr-6 h-14 bg-white/5 border border-white/5 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm tracking-wide placeholder:text-muted-foreground/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase mt-2 ml-1" />
                  </FormItem>
                )} />
                
                <Button 
                  type="submit" 
                  className="cyber-button w-full h-16 group" 
                  disabled={loginMutation.isPending} 
                  data-testid="button-submit-login"
                >
                  <span className="flex items-center justify-center gap-3">
                    {loginMutation.isPending ? t("AUTHENTICATING...", "KIRILMOQDA...", "ВХОД...") : t("SIGN_IN", "KIRISH", "ВОЙТИ")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </form>
            </Form>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-10 space-y-4">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
              {t("NEW_OPERATIVE?", "HISOBINGIZ YO'QMI?", "НЕТ АККАУНТА?")}{" "}
              <Link href="/register" className="text-primary hover:text-accent transition-colors underline underline-offset-8" data-testid="link-register">
                {t("ENLIST_NOW", "RO'YXATDAN O'TING", "ЗАРЕГИСТРИРОВАТЬСЯ")}
              </Link>
            </p>
            <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20 leading-relaxed max-w-[280px] mx-auto">
              {t("VERIFICATION_REQUIRED_FOR_NEW_RECRUITS.", "YANGI HISOBLAR TASDIQLANISHI KERAK.", "ТРЕБУЕТСЯ ПОДТВЕРЖДЕНИЕ EMAIL.")}{" "}
              <Link href="/resend-verification" className="text-primary hover:text-accent transition-colors">
                {t("RESEND_COMMS", "QAYTA YUBORISH", "ОТПРАВИТЬ")}
              </Link>
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
