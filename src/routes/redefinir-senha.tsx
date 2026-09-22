import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  completePasswordRecovery,
  hasRecoverySession,
  subscribeToRecoverySession,
} from "@/lib/password-recovery-api";
import { hasStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Agendamento de Provas" },
      {
        name: "description",
        content: "Defina uma nova senha para sua conta.",
      },
    ],
  }),
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const markReady = () => {
      if (!active) return;
      setReady(true);
      setChecking(false);
    };

    const unsubscribe = subscribeToRecoverySession(markReady);

    void hasRecoverySession().then((hasSession) => {
      if (!active) return;

      if (hasSession) {
        markReady();
      } else {
        window.setTimeout(() => {
          if (!active) return;
          setChecking(false);
        }, 1200);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || !ready) return;

    setError("");

    if (!password) {
      setError("Informe a nova senha.");
      return;
    }

    if (!hasStrongPassword(password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (!confirmPassword) {
      setError("Confirme a nova senha.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      const role = await completePasswordRecovery(password);

      if (role === "laboratory") {
        navigate({ to: "/laboratorio/login", replace: true });
        return;
      }

      navigate({ to: "/admin/login", replace: true });
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>
            Escolha uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
          ) : !ready ? (
            <div className="space-y-4">
              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Link inválido ou expirado</p>
                <p className="mt-1 text-muted-foreground">
                  Solicite um novo e-mail de recuperação para continuar.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/recuperar-senha">Solicitar novo link</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={loading}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  disabled={loading}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {error ? <p className="text-xs text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
