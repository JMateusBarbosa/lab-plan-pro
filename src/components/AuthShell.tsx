import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backTo?: "/" | "/admin/login" | "/laboratorio/login";
  backLabel?: string;
  note?: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  backTo = "/",
  backLabel = "Voltar ao início",
  note,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-brand-surface/45">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.82fr)]">
        <section className="hidden bg-primary px-10 py-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="flex items-center gap-3">
            <img
              src="/brand-mark.png"
              alt=""
              aria-hidden="true"
              className="h-14 w-14 rounded-xl bg-white/95 object-contain p-1.5 shadow-sm"
            />
            <div>
              <p className="text-lg font-semibold">Indústria do Saber</p>
              <p className="text-sm text-primary-foreground/75">Agendamento de Provas</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight xl:text-4xl">
              Acesso simples para uma rotina mais organizada.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-primary-foreground/78">
              Centralize o gerenciamento dos laboratórios e o acompanhamento das provas em um ambiente institucional, claro e seguro.
            </p>
          </div>

          <p className="text-xs text-primary-foreground/60">
            Sistema institucional · Indústria do Saber
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/brand-mark.png"
                  alt=""
                  aria-hidden="true"
                  className="h-11 w-11 object-contain"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">Indústria do Saber</p>
                  <p className="truncate text-xs text-muted-foreground">Agendamento de Provas</p>
                </div>
              </Link>
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="space-y-3 pb-4">
                <div className="h-1 w-12 rounded-full bg-accent" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {eyebrow}
                  </p>
                  <CardTitle className="mt-2 text-2xl tracking-tight">{title}</CardTitle>
                  <CardDescription className="mt-2 leading-6">{description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {children}
                {note ? (
                  <div className="mt-6 border-t pt-4 text-xs leading-5 text-muted-foreground">
                    {note}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Button asChild variant="ghost" className="mt-4 w-full text-muted-foreground">
              <Link to={backTo}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {backLabel}
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
