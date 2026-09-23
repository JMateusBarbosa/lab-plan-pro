import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface AppShellProps {
  homeTo: "/admin" | "/laboratorio";
  sectionLabel: string;
  identityLabel?: string;
  avatarLabel: string;
  renderSidebar: (onNavigate?: () => void) => ReactNode;
  children: ReactNode;
}

function Brand({
  homeTo,
  compact = false,
  onNavigate,
}: {
  homeTo: AppShellProps["homeTo"];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={homeTo}
      onClick={onNavigate}
      className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src="/brand-mark.png"
        alt=""
        aria-hidden="true"
        className={compact ? "h-9 w-9 shrink-0 object-contain" : "h-11 w-11 shrink-0 object-contain"}
      />
      <div className="min-w-0">
        <p
          className={
            compact
              ? "truncate text-sm font-semibold text-primary"
              : "truncate font-semibold text-primary"
          }
        >
          Indústria do Saber
        </p>
        {!compact ? (
          <p className="truncate text-xs text-muted-foreground">Agendamento de Provas</p>
        ) : null}
      </div>
    </Link>
  );
}

export function AppShell({
  homeTo,
  sectionLabel,
  identityLabel,
  avatarLabel,
  renderSidebar,
  children,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-surface/45">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-20 shrink-0 items-center border-b px-5">
          <Brand homeTo={homeTo} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">{renderSidebar()}</div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-2 md:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="md:hidden">
            <Brand homeTo={homeTo} compact />
          </div>

          <div className="hidden min-w-0 md:block">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Área atual
            </p>
            <p className="truncate text-sm font-semibold text-foreground">{sectionLabel}</p>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {identityLabel ? (
              <span className="hidden max-w-72 truncate text-sm text-muted-foreground sm:inline">
                {identityLabel}
              </span>
            ) : null}
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm"
            >
              {avatarLabel}
            </div>
          </div>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="flex w-[min(19rem,86vw)] flex-col gap-0 bg-sidebar p-0 sm:max-w-none"
          >
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex h-20 shrink-0 items-center border-b px-4 pr-14">
              <Brand homeTo={homeTo} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {renderSidebar(() => setMobileOpen(false))}
            </div>
          </SheetContent>
        </Sheet>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
