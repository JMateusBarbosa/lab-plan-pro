import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/laboratorio")({
  head: () => ({
    meta: [
      { title: "Área do Laboratório — Em desenvolvimento" },
      { name: "description", content: "A área do laboratório está em desenvolvimento." },
      { property: "og:title", content: "Área do Laboratório — Em desenvolvimento" },
      { property: "og:description", content: "A área do laboratório está em desenvolvimento." },
    ],
  }),
  component: LaboratorioEmDesenvolvimento,
});

function LaboratorioEmDesenvolvimento() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Em desenvolvimento</CardTitle>
          <CardDescription>
            A área do laboratório será disponibilizada em uma próxima etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
