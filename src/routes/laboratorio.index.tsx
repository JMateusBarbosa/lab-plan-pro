import { createFileRoute, Link } from "@tanstack/react-router";
import { LaboratoryLayout } from "@/layouts/LaboratoryLayout";
import { DashboardCard } from "@/components/DashboardCard";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentLaboratory, CURRENT_LABORATORY_ID } from "@/lib/laboratories-store";
import { useExams } from "@/lib/exams-store";
import { examTypeLabels } from "@/types/exam";

export const Route = createFileRoute("/laboratorio/")({
  head: () => ({
    meta: [
      { title: "Painel do Laboratório — Agendamento de Provas" },
      { name: "description", content: "Resumo das provas agendadas no laboratório." },
      { property: "og:title", content: "Painel do Laboratório" },
      { property: "og:description", content: "Resumo das provas agendadas no laboratório." },
    ],
  }),
  component: LaboratorioDashboard,
});

function LaboratorioDashboard() {
  const lab = useCurrentLaboratory();
  const { listByLaboratory } = useExams();
  const exams = listByLaboratory(CURRENT_LABORATORY_ID);
  const today = new Date().toISOString().slice(0, 10);
  const examsToday = exams.filter((e) => e.examDate === today);

  return (
    <LaboratoryLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{lab?.schoolName}</p>
          </div>
          <Button asChild>
            <Link to="/laboratorio/provas/nova">Agendar nova prova</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Provas de hoje" value={examsToday.length} />
          <DashboardCard
            title="Provas pendentes"
            value={exams.filter((e) => e.status === "pendente").length}
          />
          <DashboardCard
            title="Provas aprovadas"
            value={exams.filter((e) => e.status === "aprovado").length}
          />
          <DashboardCard title="Total de provas" value={exams.length} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Provas de hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {examsToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma prova agendada para hoje.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>PC</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examsToday.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>{exam.studentName}</TableCell>
                        <TableCell>{exam.module}</TableCell>
                        <TableCell>{exam.examTime}</TableCell>
                        <TableCell>PC {exam.pcNumber}</TableCell>
                        <TableCell>{examTypeLabels[exam.examType]}</TableCell>
                        <TableCell>
                          <ExamStatusBadge status={exam.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </LaboratoryLayout>
  );
}
