export type LaboratoryStatus = "ativo" | "inativo";

export interface Laboratory {
  id: string;
  name: string;
  schoolName: string;
  responsible: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: LaboratoryStatus;
  /** Quantidade de computadores do laboratório (gera PC 1..N). */
  computerCount: number;
  /** Horários disponíveis, no formato "HH:MM". */
  availableTimes: string[];
  createdAt: string; // ISO date
}

export type LaboratoryFormValues = Omit<Laboratory, "id" | "createdAt"> & {
  password?: string;
  confirmPassword?: string;
};

/** Gera a lista de computadores a partir da quantidade configurada. */
export function buildComputerList(computerCount: number): number[] {
  return Array.from({ length: Math.max(0, computerCount) }, (_, i) => i + 1);
}
