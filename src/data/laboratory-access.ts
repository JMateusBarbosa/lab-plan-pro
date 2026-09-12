import type { LaboratoryAccess } from "@/types/laboratory";

/** Dados mockados das contas de acesso até o provisionamento real via Supabase Auth. */
export const mockLaboratoryAccess: LaboratoryAccess[] = [
  { laboratoryId: "1", email: "lab.maues@exemplo.com" },
  { laboratoryId: "2", email: "lab.centro@exemplo.com" },
  { laboratoryId: "3", email: "lab.norte@exemplo.com" },
];
