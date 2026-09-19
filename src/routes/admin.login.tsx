import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAdmin } from "@/lib/admin-session-api";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login do Administrador — Agendamento de Provas" },
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Área Administrativa</CardTitle>
          <CardDescription>Entre com suas credenciais de administrador.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <Button asChild variant="link" className="w-full">
              <Link to="/recuperar-senha">Esqueci minha senha</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Voltar</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
