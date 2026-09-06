import { Badge } from "@/components/ui/badge";
import { examStatusLabels, type ExamStatus } from "@/types/exam";

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  return (
    <Badge variant={status === "aprovado" ? "default" : "secondary"}>
      {examStatusLabels[status]}
    </Badge>
  );
}
