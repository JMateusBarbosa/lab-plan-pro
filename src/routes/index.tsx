import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        </CardContent>
      </Card>
    </main>
  );
}
