import { Badge } from "@/components/ui/badge";
import { examStatusLabels, type ExamStatus } from "@/types/exam";

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  const variant = status === "aprovado" ? "default" : status === "reprovado" ? "destructive" : "secondary";
  return <Badge variant={variant}>{examStatusLabels[status]}</Badge>;
}
