import { Badge } from "@/components/ui/badge";
import type { LaboratoryStatus } from "@/types/laboratory";

export function StatusBadge({ status }: { status: LaboratoryStatus }) {
  return (
    <Badge variant={status === "ativo" ? "default" : "secondary"}>
      {status === "ativo" ? "Ativo" : "Inativo"}
    </Badge>
  );
}
