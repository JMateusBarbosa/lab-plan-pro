import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Settings2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agendamento de Provas | Indústria do Saber" },
      {
        name: "description",
        content:
          "Plataforma para gerenciar laboratórios de informática escolares e agendar provas.",
      },
      { property: "og:title", content: "Agendamento de Provas | Indústria do Saber" },
      {
        property: "og:description",
        content:
          "Plataforma para gerenciar laboratórios de informática escolares e agendar provas.",
      },
    ],
  }),
  component: Index,
});

function AccessCard({
  icon,
  title,
  description,
  to,
  label,
  primary = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: "/admin/login" | "/laboratorio/login";
  label: string;
  primary?: boolean;
}) {
  return (
    <Card className="h-full border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button asChild className="mt-6 w-full" variant={primary ? "default" : "outline"}>
          <Link to={to}>{label}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function Index() {
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.rpc("is_bootstrap_available").then(({ data, error }) => {
      if (!active) return;
      if (!error) setBootstrapAvailable(Boolean(data));
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-brand-surface/45">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/brand-mark.png" alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-semibold text-primary">Indústria do Saber</p>
              <p className="text-xs text-muted-foreground">Agendamento de Provas</p>
            </div>
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12 sm:py-16">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="mx-auto mb-5 h-1 w-14 rounded-full bg-accent" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Sistema institucional
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Agendamento de provas mais simples e organizado.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Acesse a área correspondente ao seu perfil para gerenciar laboratórios ou acompanhar a rotina de provas da unidade.
            </p>
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-3xl gap-4 md:grid-cols-2">
            <AccessCard
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              title="Administração"
              description="Gerencie laboratórios, credenciais, auditoria e configurações administrativas."
              to="/admin/login"
              label="Entrar como administrador"
              primary
            />
            <AccessCard
              icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
              title="Laboratório"
              description="Acesse os agendamentos, resultados e o fluxo diário de provas do laboratório."
              to="/laboratorio/login"
              label="Entrar como laboratório"
            />
          </div>

          {bootstrapAvailable ? (
            <div className="mx-auto mt-6 w-full max-w-3xl rounded-lg border border-dashed bg-background/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">Configuração inicial disponível</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      A criação do primeiro administrador é permitida somente durante a configuração inicial.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/cadastro">Configurar administrador</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <footer className="border-t py-5 text-center text-xs text-muted-foreground">
          Indústria do Saber · Sistema de Agendamento de Provas
        </footer>
      </div>
    </main>
  );
}
