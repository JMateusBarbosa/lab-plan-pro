import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, FlaskConical, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAdminSessionActions,
  useAdminSessionQuery,
} from "@/lib/admin-session-queries";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Laboratórios", to: "/admin/laboratorios", icon: FlaskConical, exact: false },
  { label: "Auditoria", to: "/admin/auditoria", icon: ClipboardList, exact: false },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { clearSession } = useAdminSessionActions();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    onNavigate?.();
    try {
      await clearSession();
    } finally {
      navigate({ to: "/admin/login" });
      setLoggingOut(false);
    }
  };

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="mt-auto justify-start gap-2 text-muted-foreground"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? "Saindo..." : "Sair"}
      </Button>
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: session, isLoading, isError } = useAdminSessionQuery();
  const { clearSession } = useAdminSessionActions();

  useEffect(() => {
    if (!isError) return;

    let active = true;
    const leave = async () => {
      try {
        await clearSession();
      } finally {
        if (active) navigate({ to: "/admin/login" });
      }
    };

    void leave();
    return () => {
      active = false;
    };
  }, [clearSession, isError, navigate]);

  if (isLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">
          {isError ? "Redirecionando para o login..." : "Verificando acesso..."}
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Link to="/admin" className="truncate text-sm font-semibold sm:text-base">
          Sistema de Agendamento de Provas
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <span className="hidden max-w-64 truncate text-sm text-muted-foreground sm:inline">
            {session.email}
          </span>
          <div
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
          >
            AD
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r bg-background md:block">
          <SidebarContent />
        </aside>

        {open ? (
          <div className="fixed inset-0 top-14 z-20 md:hidden">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <aside className="relative h-[calc(100vh-3.5rem)] w-60 border-r bg-background">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
