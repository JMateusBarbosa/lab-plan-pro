import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  useAdminLaboratoryQuery,
  useResetLaboratoryAccessPasswordMutation,
  useUpdateLaboratoryAccessEmailMutation,
} from "@/lib/admin-laboratories-queries";
import { hasStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";

export const Route = createFileRoute("/admin/laboratorios/$id/credenciais")({
  head: () => ({
    meta: [
      { title: "Credenciais do laboratório — Agendamento de Provas" },
      {
        name: "description",
        content: "Gerencie o e-mail e a senha da conta de acesso do laboratório.",
      },
    ],
  }),
  component: CredenciaisLaboratorio,
});

function CredenciaisLaboratorio() {
  const { id } = Route.useParams();
  const { data: details, isLoading, isError, refetch } = useAdminLaboratoryQuery(id);
  const updateEmail = useUpdateLaboratoryAccessEmailMutation(id);
  const resetPassword = useResetLaboratoryAccessPasswordMutation(id);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (details?.accessEmail) setEmail(details.accessEmail);
  }, [details?.accessEmail]);

  if (isLoading) {
    return (
      <AdminLayout>
        <p className="text-sm text-muted-foreground">Carregando conta do laboratório...</p>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="space-y-3">
          <p className="text-sm text-destructive">
            Não foi possível carregar a conta do laboratório.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!details) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Laboratório não encontrado.</p>
          <Button asChild variant="outline">
            <Link to="/admin/laboratorios">Voltar</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const currentEmail = details.accessEmail.trim().toLowerCase();
  const busy = updateEmail.isPending || resetPassword.isPending;

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const normalizedEmail = email.trim().toLowerCase();
    setEmailError("");

    if (!normalizedEmail) {
      setEmailError("Informe o novo e-mail de acesso.");
      return;
    }

    if (normalizedEmail === currentEmail) {
      setEmailError("O novo e-mail é igual ao e-mail atual.");
      return;
    }

    try {
      await updateEmail.mutateAsync(normalizedEmail);
      toast.success("E-mail de acesso alterado com sucesso.");
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : "Não foi possível alterar o e-mail de acesso.",
      );
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setPasswordError("");

    if (!password) {
      setPasswordError("Informe a nova senha.");
      return;
    }

    if (!hasStrongPassword(password)) {
      setPasswordError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (!confirmPassword) {
      setPasswordError("Confirme a nova senha.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("As senhas não conferem.");
      return;
    }

    try {
      const result = await resetPassword.mutateAsync(password);
      setPassword("");
      setConfirmPassword("");

      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Senha de acesso redefinida com sucesso.");
      }
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Não foi possível redefinir a senha.",
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar credenciais"
          description={details.laboratory.name + " · " + details.laboratory.schoolName}
          breadcrumbs={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/admin/laboratorios">Laboratórios</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin/laboratorios/$id" params={{ id }}>{details.laboratory.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Credenciais</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          actions={
            <Button asChild variant="outline">
              <Link to="/admin/laboratorios/$id" params={{ id }}>Voltar ao laboratório</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">E-mail de acesso</CardTitle>
            <CardDescription>
              O e-mail funciona como login da conta. A alteração é aplicada diretamente à conta
              vinculada a este laboratório e registrada na auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4 sm:max-w-lg">
              <div className="space-y-1.5">
                <Label htmlFor="currentEmail">E-mail atual</Label>
                <Input id="currentEmail" value={details.accessEmail} disabled readOnly />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newEmail">Novo e-mail</Label>
                <Input
                  id="newEmail"
                  type="email"
                  autoComplete="off"
                  value={email}
                  disabled={busy}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}

              <Button type="submit" disabled={busy || email.trim().toLowerCase() === currentEmail}>
                {updateEmail.isPending ? "Alterando e-mail..." : "Alterar e-mail de acesso"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Redefinir senha</CardTitle>
            <CardDescription>
              Defina uma nova senha temporária para a conta. A senha nunca é armazenada nos logs de
              auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:max-w-lg">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={busy}
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
                  disabled={busy}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              {passwordError ? (
                <p className="text-xs text-destructive">{passwordError}</p>
              ) : null}

              <Button type="submit" disabled={busy}>
                {resetPassword.isPending ? "Redefinindo senha..." : "Redefinir senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Alterações de credenciais são operações administrativas sensíveis e ficam registradas na
          auditoria do sistema.
        </p>
      </div>
    </AdminLayout>
  );
}
