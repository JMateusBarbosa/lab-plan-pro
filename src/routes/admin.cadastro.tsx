import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/cadastro")({
  head: () => ({
    meta: [
      { title: "Configuração do Administrador | Indústria do Saber" },
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
    <AuthShell
      eyebrow="Configuração administrativa"
      title="Cadastro público desativado"
      description="Administradores não podem ser criados por uma tela pública. Novas contas devem ser provisionadas por um procedimento interno e autenticado."
      backTo="/admin/login"
      backLabel="Voltar ao login administrativo"
      note="Esta proteção evita a criação não autorizada de contas com privilégios administrativos."
    >
      <Button asChild className="w-full">
        <Link to="/admin/login">Ir para o login administrativo</Link>
      </Button>
    </AuthShell>
  );
}
