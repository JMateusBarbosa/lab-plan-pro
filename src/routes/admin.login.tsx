import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAdmin } from "@/lib/admin-session-api";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login Administrativo | Indústria do Saber" },
      { name: "description", content: "Acesso à área administrativa do sistema." },
      { property: "og:title", content: "Login do Administrador" },
      { property: "og:description", content: "Acesso à área administrativa do sistema." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      await signInAdmin(email, password);
      navigate({ to: "/admin" });
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Área administrativa"
      title="Entrar como administrador"
      description="Use suas credenciais administrativas para gerenciar laboratórios, auditoria e configurações do sistema."
      note="Acesso restrito a contas administrativas autorizadas."
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
            placeholder="seuemail@exemplo.com"
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
