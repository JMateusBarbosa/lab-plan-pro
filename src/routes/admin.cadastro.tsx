import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/cadastro")({
  head: () => ({
    meta: [
      { title: "Configuração do Administrador — Agendamento de Provas" },
      {
        name: "description",
        content: "O cadastro público de administradores está desativado por segurança.",
      },
    ],
  }),
  component: AdminCadastro,
});

function AdminCadastro() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cadastro público desativado</CardTitle>
          <CardDescription>
            Administradores não podem ser criados por uma tela pública. Novas contas administrativas devem ser provisionadas por um procedimento interno e autenticado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild className="w-full">
            <Link to="/admin/login">Ir para o login</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/">Voltar</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
