import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInLaboratory } from "@/lib/laboratory-session-api";
import {
  laboratoryQueryRootKey,
  laboratorySessionKey,
} from "@/lib/laboratory-session-queries";

export const Route = createFileRoute("/laboratorio/login")({
  head: () => ({
    meta: [
      { title: "Login do Laboratório | Indústria do Saber" },
      { name: "description", content: "Acesso da equipe do laboratório ao agendamento de provas." },
      { property: "og:title", content: "Login do Laboratório" },
      {
        property: "og:description",
        content: "Acesso da equipe do laboratório ao agendamento de provas.",
      },
    ],
  }),
  component: LaboratorioLogin,
});

function LaboratorioLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const session = await signInLaboratory(email, password);
      queryClient.removeQueries({ queryKey: laboratoryQueryRootKey });
      queryClient.setQueryData(laboratorySessionKey, session);
      navigate({ to: "/laboratorio" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área do laboratório"
      title="Entrar no laboratório"
      description="Use as credenciais fornecidas para acessar os agendamentos e a rotina de provas do laboratório."
      note="Cada laboratório possui uma conta própria vinculada à sua unidade."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="laboratorio@exemplo.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <Button asChild variant="link" className="w-full">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </Button>
      </form>
    </AuthShell>
  );
}
