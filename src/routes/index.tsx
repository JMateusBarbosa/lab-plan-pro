import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema de Agendamento de Provas" },
      {
        name: "description",
        content:
          "Plataforma para gerenciar laboratórios de informática escolares e agendar provas.",
      },
      { property: "og:title", content: "Sistema de Agendamento de Provas" },
      {
        property: "og:description",
        content:
          "Plataforma para gerenciar laboratórios de informática escolares e agendar provas.",
      },
    ],
  }),
  component: Index,
});

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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Agendamento de Provas</CardTitle>
          <CardDescription>
            Gerencie os laboratórios de informática das escolas e organize o agendamento de provas
            em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link to="/admin/login">Entrar como Administrador</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/laboratorio/login">Entrar como Laboratório</Link>
          </Button>
          {bootstrapAvailable ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/admin/cadastro">Criar primeiro administrador</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                A criação de administrador é aceita apenas na configuração inicial do sistema.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
