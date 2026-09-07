import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/laboratorio/login")({
  head: () => ({
    meta: [
      { title: "Login do Laboratório — Agendamento de Provas" },
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    // Login simulado — autenticação real será implementada futuramente.
    navigate({ to: "/laboratorio" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Área do Laboratório</CardTitle>
          <CardDescription>Entre com as credenciais do laboratório.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Voltar</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
