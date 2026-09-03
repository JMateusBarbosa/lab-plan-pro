import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import type { Laboratory } from "@/types/laboratory";

interface LaboratoryCardProps {
  laboratory: Laboratory;
  onToggleStatus: (id: string) => void;
  onDelete: (laboratory: Laboratory) => void;
}

export function LaboratoryCard({ laboratory, onToggleStatus, onDelete }: LaboratoryCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{laboratory.name}</p>
            <p className="truncate text-sm text-muted-foreground">{laboratory.schoolName}</p>
          </div>
          <StatusBadge status={laboratory.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Responsável</dt>
          <dd className="truncate">{laboratory.responsible || "—"}</dd>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="truncate">{laboratory.email}</dd>
          <dt className="text-muted-foreground">Cidade/UF</dt>
          <dd className="truncate">
            {laboratory.city} / {laboratory.state}
          </dd>
          <dt className="text-muted-foreground">Cadastro</dt>
          <dd>{laboratory.createdAt}</dd>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/laboratorios/$id" params={{ id: laboratory.id }}>
              Visualizar
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/laboratorios/$id/editar" params={{ id: laboratory.id }}>
              Editar
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggleStatus(laboratory.id)}>
            {laboratory.status === "ativo" ? "Desativar" : "Ativar"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(laboratory)}>
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
