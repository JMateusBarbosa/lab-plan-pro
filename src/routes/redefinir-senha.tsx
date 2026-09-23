import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
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
    <AuthShell
      eyebrow="Segurança da conta"
      title="Redefinir senha"
      description="Crie uma nova senha para concluir a recuperação da sua conta."
      backTo="/recuperar-senha"
      backLabel="Voltar para recuperação"
    >
      {checking ? (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          Validando link de recuperação...
        </div>
      ) : !ready ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-foreground">Link inválido ou expirado</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Solicite um novo e-mail de recuperação para continuar.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/recuperar-senha">Solicitar novo link</Link>
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
            <p className="text-xs leading-5 text-muted-foreground">
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

          {error ? (
            <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
