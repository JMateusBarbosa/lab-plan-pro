export type LaboratoryStatus = "ativo" | "inativo";

export interface Laboratory {
  id: string;
  name: string;
  schoolName: string;
  responsible: string;
  phone: string;
  city: string;
  state: string;
  status: LaboratoryStatus;
  computerCount: number;
  createdAt: string;
  updatedAt?: string;
}

export type LaboratoryFormValues = Omit<Laboratory, "id" | "createdAt" | "updatedAt">;

export interface LaboratoryAccess {
  laboratoryId: string;
  email: string;
}

export interface LaboratoryAccessFormValues {
  email: string;
  password?: string;
  confirmPassword?: string;
}

export type LaboratoryProvisioningFormValues = LaboratoryFormValues & LaboratoryAccessFormValues;

export function buildComputerList(computerCount: number): number[] {
  return Array.from({ length: Math.max(0, computerCount) }, (_, i) => i + 1);
}
