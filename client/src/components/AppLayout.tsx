import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ReactNode } from "react";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="editorial-headline mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="editorial-headline mb-4">Allsleepers</h1>
          <p className="editorial-subheading mb-8 text-muted-foreground">Ad Launch Control Center</p>
          <div className="editorial-divider-thin mb-8" />
          <p className="mb-8 text-foreground leading-relaxed">
            Intelligent approval dashboard for managing ad creatives with AI-powered copy suggestions.
          </p>
          <a href={getLoginUrl()}>
            <Button className="editorial-button-primary w-full">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-8">
            <h1 className="editorial-headline text-2xl mb-0">Allsleepers</h1>
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setLocation("/dashboard")}
                className="editorial-label hover:text-foreground transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => setLocation("/settings")}
                className="editorial-label hover:text-foreground transition-colors"
              >
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                setLocation("/");
              }}
              className="text-xs uppercase tracking-wider"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container py-8 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Facebook Ads Launcher • Powered by Allsleepers
          </p>
        </div>
      </footer>
    </div>
  );
}
