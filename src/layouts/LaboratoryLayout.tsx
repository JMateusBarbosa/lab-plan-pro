import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarPlus, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useLaboratorySessionActions,
  useLaboratorySessionQuery,
} from "@/lib/laboratory-session-queries";

const navItems = [
  { label: "Dashboard", to: "/laboratorio", icon: LayoutDashboard, exact: true },
  { label: "Provas", to: "/laboratorio/provas", icon: ClipboardList, exact: true },
  { label: "Agendar prova", to: "/laboratorio/provas/nova", icon: CalendarPlus, exact: true },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { clearSession } = useLaboratorySessionActions();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    onNavigate?.();

    try {
      await clearSession();
    } finally {
      navigate({ to: "/laboratorio/login" });
      setLoggingOut(false);
    }
  };

  return (
    <nav className="flex h-full flex-col gap-1" aria-label="Navegação do laboratório">
      <div className="mb-2 px-3 pt-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Laboratório
        </p>
      </div>

      {navItems.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <Button
        variant="ghost"
        className="mt-auto justify-start gap-3 rounded-lg px-3 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? "Saindo..." : "Sair"}
      </Button>
    </nav>
  );
}

export function LaboratoryLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useLaboratorySessionQuery();
  const { clearSession } = useLaboratorySessionActions();

  useEffect(() => {
    if (!isError) return;

    let active = true;

    const leave = async () => {
      try {
        await clearSession();
      } finally {
        if (active) navigate({ to: "/laboratorio/login" });
      }
    };

    void leave();

    return () => {
      active = false;
    };
  }, [clearSession, isError, navigate]);

  if (isLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-surface/45 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/brand-mark.png" alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
          <p className="text-sm text-muted-foreground">
            {isError ? "Redirecionando para o login..." : "Verificando acesso..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      homeTo="/laboratorio"
      sectionLabel="Laboratório"
      identityLabel={session.laboratory.schoolName}
      avatarLabel="LB"
      renderSidebar={(onNavigate) => <SidebarContent onNavigate={onNavigate} />}
    >
      {children}
    </AppShell>
  );
}
