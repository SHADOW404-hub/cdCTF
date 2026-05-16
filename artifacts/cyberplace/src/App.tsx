import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { SeoManager } from "@/lib/seo";
import { Navbar } from "@/components/Navbar";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import CtfListPage from "@/pages/CtfListPage";
import CtfDetailPage from "@/pages/CtfDetailPage";
import LearnPage from "@/pages/LearnPage";
import LessonDetailPage from "@/pages/LessonDetailPage";
import LessonTestPage from "@/pages/LessonTestPage";
import ScoreboardPage from "@/pages/ScoreboardPage";
import CompetitionsPage from "@/pages/CompetitionsPage";
import CompetitionDetailPage from "@/pages/CompetitionDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileEditPage from "@/pages/ProfileEditPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCtfPage from "@/pages/admin/AdminCtfPage";
import AdminCompetitionsPage from "@/pages/admin/AdminCompetitionsPage";
import AdminLessonsPage from "@/pages/admin/AdminLessonsPage";
import AdminBlockedPage from "@/pages/admin/AdminBlockedPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import CompetitionCtfPage from "@/pages/CompetitionCtfPage";
import ResendVerificationPage from "@/pages/ResendVerificationPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import NotFound from "@/pages/not-found";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to="/" />;
  return <Component />;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

function Router() {
  return (
    <>
      <SeoManager />
      <Navbar />
      <AnimatePresence mode="wait">
        <Switch>
          <Route path="/">
            {() => <PageTransition><HomePage /></PageTransition>}
          </Route>
          <Route path="/login">
            {() => <PageTransition><LoginPage /></PageTransition>}
          </Route>
          <Route path="/register">
            {() => <PageTransition><RegisterPage /></PageTransition>}
          </Route>
          <Route path="/verify-email">
            {() => <PageTransition><VerifyEmailPage /></PageTransition>}
          </Route>
          <Route path="/forgot-password">
            {() => <PageTransition><ForgotPasswordPage /></PageTransition>}
          </Route>
          <Route path="/reset-password">
            {() => <PageTransition><ResetPasswordPage /></PageTransition>}
          </Route>
          <Route path="/resend-verification">
            {() => <PageTransition><ResendVerificationPage /></PageTransition>}
          </Route>
          <Route path="/ctf">
            {() => <PageTransition><CtfListPage /></PageTransition>}
          </Route>
          <Route path="/ctf/:id">
            {(params) => <PageTransition><CtfDetailPage id={params.id} /></PageTransition>}
          </Route>
          <Route path="/learn">
            {() => <PageTransition><LearnPage /></PageTransition>}
          </Route>
          <Route path="/learn/:id/test">
            {(params) => <PageTransition><LessonTestPage id={params.id} /></PageTransition>}
          </Route>
          <Route path="/learn/:id">
            {(params) => <PageTransition><LessonDetailPage id={params.id} /></PageTransition>}
          </Route>
          <Route path="/scoreboard">
            {() => <PageTransition><ScoreboardPage /></PageTransition>}
          </Route>
          <Route path="/competitions">
            {() => <PageTransition><CompetitionsPage /></PageTransition>}
          </Route>
          <Route path="/competitions/:id">
            {(params) => <PageTransition><CompetitionDetailPage id={params.id} /></PageTransition>}
          </Route>
          <Route path="/competitions/:competitionId/ctf/:ctfId">
            {(params) => (
              <PageTransition>
                <ProtectedRoute component={() => <CompetitionCtfPage competitionId={params.competitionId} ctfId={params.ctfId} />} />
              </PageTransition>
            )}
          </Route>
          <Route path="/dashboard">
            {() => <PageTransition><ProtectedRoute component={DashboardPage} /></PageTransition>}
          </Route>
          <Route path="/profile/edit">
            {() => <PageTransition><ProtectedRoute component={ProfileEditPage} /></PageTransition>}
          </Route>
          <Route path="/profile">
            {() => <PageTransition><ProtectedRoute component={ProfilePage} /></PageTransition>}
          </Route>
          <Route path="/profile/:id">
            {(params) => <PageTransition><ProfilePage id={params.id} /></PageTransition>}
          </Route>
          
          <Route path="/admin/dashboard">
            {() => <PageTransition><AdminRoute component={AdminDashboardPage} /></PageTransition>}
          </Route>
          <Route path="/admin/users">
            {() => <PageTransition><AdminRoute component={AdminUsersPage} /></PageTransition>}
          </Route>
          <Route path="/admin/ctf">
            {() => <PageTransition><AdminRoute component={AdminCtfPage} /></PageTransition>}
          </Route>
          <Route path="/admin/competitions">
            {() => <PageTransition><AdminRoute component={AdminCompetitionsPage} /></PageTransition>}
          </Route>
          <Route path="/admin/lessons">
            {() => <PageTransition><AdminRoute component={AdminLessonsPage} /></PageTransition>}
          </Route>
          <Route path="/admin/blocked">
            {() => <PageTransition><AdminRoute component={AdminBlockedPage} /></PageTransition>}
          </Route>
          <Route path="/admin/audit">
            {() => <PageTransition><AdminRoute component={AdminAuditPage} /></PageTransition>}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <Toaster />
          </WouterRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
