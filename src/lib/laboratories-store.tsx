import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockLaboratories } from "@/data/laboratories";
import { getLocalDateString } from "@/lib/date";
import type { Laboratory, LaboratoryFormValues } from "@/types/laboratory";

interface LaboratoriesContextValue {
  laboratories: Laboratory[];
  getById: (id: string) => Laboratory | undefined;
  create: (values: LaboratoryFormValues) => Laboratory;
  update: (id: string, values: LaboratoryFormValues) => void;
  toggleStatus: (id: string) => void;
}

const LaboratoriesContext = createContext<LaboratoriesContextValue | null>(null);

export function LaboratoriesProvider({ children }: { children: ReactNode }) {
  const [laboratories, setLaboratories] = useState<Laboratory[]>(mockLaboratories);

  const getById = useCallback(
    (id: string) => laboratories.find((lab) => lab.id === id),
    [laboratories],
  );

  const create = useCallback((values: LaboratoryFormValues) => {
    const lab: Laboratory = {
      id: String(Date.now()),
      name: values.name,
      schoolName: values.schoolName,
      responsible: values.responsible,
      phone: values.phone,
      city: values.city,
      state: values.state,
      status: values.status,
      computerCount: Number(values.computerCount) || 1,
      createdAt: getLocalDateString(),
    };
    setLaboratories((prev) => [lab, ...prev]);
    return lab;
  }, []);

  const update = useCallback((id: string, values: LaboratoryFormValues) => {
    setLaboratories((prev) =>
      prev.map((lab) =>
        lab.id === id
          ? {
              ...lab,
              name: values.name,
              schoolName: values.schoolName,
              responsible: values.responsible,
              phone: values.phone,
              city: values.city,
              state: values.state,
              status: values.status,
              computerCount: Number(values.computerCount) || 1,
            }
          : lab,
      ),
    );
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setLaboratories((prev) =>
      prev.map((lab) =>
        lab.id === id ? { ...lab, status: lab.status === "ativo" ? "inativo" : "ativo" } : lab,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ laboratories, getById, create, update, toggleStatus }),
    [laboratories, getById, create, update, toggleStatus],
  );

  return <LaboratoriesContext.Provider value={value}>{children}</LaboratoriesContext.Provider>;
}

export function useLaboratories() {
  const ctx = useContext(LaboratoriesContext);
  if (!ctx) throw new Error("useLaboratories deve ser usado dentro de LaboratoriesProvider");
  return ctx;
}

export const CURRENT_LABORATORY_ID = "1";

export function useCurrentLaboratory() {
  const { getById } = useLaboratories();
  return getById(CURRENT_LABORATORY_ID);
}
