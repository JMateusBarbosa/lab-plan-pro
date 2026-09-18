import { Link } from "@tanstack/react-router";
import { CheckCircle2, CircleDot, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamStatusBadge } from "@/components/ExamStatusBadge";
import { getExamAttemptChain, getExamAttemptLabel } from "@/lib/exam-lineage";
import type { Exam } from "@/types/exam";

interface ExamAttemptTimelineProps {
  exam: Exam;
  exams: Exam[];
}

function StatusIcon({ status }: { status: Exam["status"] }) {
  if (status === "aprovado") return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  if (status === "reprovado") return <XCircle className="h-4 w-4" aria-hidden="true" />;
  return <Clock3 className="h-4 w-4" aria-hidden="true" />;
}

export function ExamAttemptTimeline({ exam, exams }: ExamAttemptTimelineProps) {
  const attempts = getExamAttemptChain(exams, exam);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Histórico de tentativas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Acompanhe a sequência completa desta prova, da P1 até a tentativa mais recente.
        </p>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tentativa encontrada.</p>
        ) : (
          <ol className="space-y-0">
            {attempts.map((attempt, index) => {
              const isCurrent = attempt.id === exam.id;
              const isLast = index === attempts.length - 1;

              return (
                <li key={attempt.id} className="relative grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0">
                  {!isLast ? (
                    <span
                      className="absolute left-[0.9375rem] top-7 h-[calc(100%-0.5rem)] w-px bg-border"
                      aria-hidden="true"
                    />
                  ) : null}

                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                    {isCurrent ? (
                      <CircleDot className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <StatusIcon status={attempt.status} />
                    )}
                  </div>

                  <div
                    className={
                      isCurrent
                        ? "rounded-md border bg-muted/40 p-3"
                        : "rounded-md border p-3"
                    }
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{getExamAttemptLabel(exams, attempt)}</p>
                          {isCurrent ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                              Tentativa atual
                            </span>
                          ) : null}
                          <ExamStatusBadge status={attempt.status} />
                        </div>

                        <dl className="mt-2 grid gap-x-5 gap-y-1 text-sm text-muted-foreground sm:grid-cols-3">
                          <div>
                            <dt className="sr-only">Data</dt>
                            <dd>{attempt.examDate}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Horário</dt>
                            <dd>{attempt.studentClassTime}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Computador</dt>
                            <dd>PC {attempt.pcNumber}</dd>
                          </div>
                        </dl>
                      </div>

                      {!isCurrent ? (
                        <Button asChild size="sm" variant="outline" className="shrink-0">
                          <Link to="/laboratorio/provas/$id" params={{ id: attempt.id }}>
                            Ver tentativa
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
