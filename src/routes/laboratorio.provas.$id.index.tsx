import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExams } from "@/lib/exams-store";
import { CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";
import { examTypeLabels } from "@/types/exam";

export const Route = createFileRoute("/laboratorio/provas/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhes da prova — Agendamento de Provas" },
      { name: "description", content: "Informações completas da prova agendada." },
      { property: "og:title", content: "Detalhes da prova" },
      { property: "og:description", content: "Informações completas da prova agendada." },
    ],
  }),
  component: DetalhesProva,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function DetalhesProva() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getById, remove } = useExams();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const exam = getById(id);

  if (!exam || exam.laboratoryId !== CURRENT_LABORATORY_ID) {
    return (
      <LaboratoryLayout>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Prova não encontrada.</p>
          <Button asChild variant="outline">
            <Link to="/laboratorio/provas">Voltar</Link>
          </Button>
        </div>
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">{exam.studentName}</h1>
            <p className="text-sm text-muted-foreground">{exam.module}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/laboratorio/provas/$id/editar" params={{ id: exam.id }}>
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Excluir
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/laboratorio/provas" })}>
              Voltar
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da prova</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="Nome do aluno" value={exam.studentName} />
              <Info label="Módulo" value={exam.module} />
              <Info label="Data" value={exam.examDate} />
              <Info label="Horário" value={exam.examTime} />
              <Info label="Computador" value={`PC ${exam.pcNumber}`} />
              <Info label="Tipo" value={examTypeLabels[exam.examType]} />
              <Info label="Status" value={<ExamStatusBadge status={exam.status} />} />
              <Info label="Data do cadastro" value={exam.createdAt} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir prova"
        description={`A prova de ${exam.studentName} será removida.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          remove(exam.id);
          toast.success("Prova excluída com sucesso.");
          navigate({ to: "/laboratorio/provas" });
        }}
      />
    </LaboratoryLayout>
  );
}
