import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateLaboratoryExamStatusMutation } from "@/lib/laboratory-exams-queries";
import { getNextAttemptLabel } from "@/lib/exam-lineage";
import type { Exam } from "@/types/exam";

interface ExamResultDialogProps {
  exam: Exam;
  exams: Exam[];
}

export function ExamResultDialog({ exam, exams }: ExamResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState<"aprovado" | "reprovado" | null>(null);
  const updateStatus = useUpdateLaboratoryExamStatusMutation(exam.id);

  const saveResult = async (status: "aprovado" | "reprovado") => {
    if (updateStatus.isPending) return;

    try {
      await updateStatus.mutateAsync(status);
      setSavedStatus(status);
      toast.success(status === "aprovado" ? "Aluno aprovado." : "Resultado registrado como reprovado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o resultado.");
    }
  };

  const close = () => {
    if (updateStatus.isPending) return;
    setOpen(false);
    setSavedStatus(null);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      {exam.status === "pendente" ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">Registrar resultado</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar resultado</DialogTitle>
          <DialogDescription>
            {exam.studentName} · {exam.module}
          </DialogDescription>
        </DialogHeader>

        {!savedStatus ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Informe somente o resultado desta tentativa. Se o aluno reprovar, o sistema poderá
              conduzir você diretamente ao agendamento da próxima tentativa.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                disabled={updateStatus.isPending}
                onClick={() => void saveResult("aprovado")}
              >
                Aprovado
              </Button>
              <Button
                variant="destructive"
                disabled={updateStatus.isPending}
                onClick={() => void saveResult("reprovado")}
              >
                Reprovado
              </Button>
            </div>
          </div>
        ) : savedStatus === "aprovado" ? (
          <div className="space-y-3 rounded-md border p-4">
            <p className="font-medium">Processo concluído.</p>
            <p className="text-sm text-muted-foreground">
              O aluno foi aprovado nesta tentativa. Nenhuma nova recuperação é necessária.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-md border p-4">
            <div>
              <p className="font-medium">Aluno reprovado.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Você pode agendar {getNextAttemptLabel(exams, exam)} agora. Aluno e módulo serão
                preenchidos automaticamente.
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/laboratorio/provas/$id/proxima" params={{ id: exam.id }} onClick={() => setOpen(false)}>
                Agendar próxima tentativa
              </Link>
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={updateStatus.isPending}>
            {savedStatus ? "Fechar" : "Cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
