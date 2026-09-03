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
  createdAt: string; // ISO date
}

export type LaboratoryFormValues = Omit<Laboratory, "id" | "createdAt"> & {
  password?: string;
  confirmPassword?: string;
};
