import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordRecovery } from "@/lib/password-recovery-api";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Agendamento de Provas" },
      {
        name: "description",
        content: "Solicite um link seguro para redefinir a senha da sua conta.",
      },
    ],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError("");

    if (!email.trim()) {
      setError("Informe o e-mail da conta.");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordRecovery(email);
      setSent(true);
    } catch (recoveryError) {
      setError(
        recoveryError instanceof Error
          ? recoveryError.message
          : "Não foi possível solicitar a recuperação de senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail usado para acessar o sistema. Se houver uma conta correspondente,
            enviaremos um link para redefinir a senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Verifique seu e-mail</p>
                <p className="mt-1 text-muted-foreground">
                  Se houver uma conta cadastrada com esse endereço, você receberá um link de
                  recuperação. Verifique também a caixa de spam.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
              >
                Enviar novamente
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {error ? <p className="text-xs text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
