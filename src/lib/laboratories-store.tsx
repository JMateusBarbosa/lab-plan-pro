import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockLaboratories } from "@/data/laboratories";
import type { Laboratory, LaboratoryFormValues } from "@/types/laboratory";

/**
 * Store em memória apenas para prototipagem da interface.
 * Futuramente estas funções serão substituídas por chamadas ao backend.
 */
interface LaboratoriesContextValue {
  laboratories: Laboratory[];
  getById: (id: string) => Laboratory | undefined;
  create: (values: LaboratoryFormValues) => Laboratory;
  update: (id: string, values: LaboratoryFormValues) => void;
  toggleStatus: (id: string) => void;
  remove: (id: string) => void;
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
      email: values.email,
      phone: values.phone,
      city: values.city,
      state: values.state,
      status: values.status,
      computerCount: Number(values.computerCount) || 1,
      availableTimes: [...values.availableTimes].sort(),
      createdAt: new Date().toISOString().slice(0, 10),
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
              email: values.email,
              phone: values.phone,
              city: values.city,
              state: values.state,
              status: values.status,
              computerCount: Number(values.computerCount) || 1,
              availableTimes: [...values.availableTimes].sort(),
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

  const remove = useCallback((id: string) => {
    setLaboratories((prev) => prev.filter((lab) => lab.id !== id));
  }, []);

  const value = useMemo(
    () => ({ laboratories, getById, create, update, toggleStatus, remove }),
    [laboratories, getById, create, update, toggleStatus, remove],
  );

  return <LaboratoriesContext.Provider value={value}>{children}</LaboratoriesContext.Provider>;
}

export function useLaboratories() {
  const ctx = useContext(LaboratoriesContext);
  if (!ctx) throw new Error("useLaboratories deve ser usado dentro de LaboratoriesProvider");
  return ctx;
}

/**
 * Laboratório "logado" — mock único até existir autenticação real.
 * Futuramente virá da sessão do usuário autenticado.
 */
export const CURRENT_LABORATORY_ID = "1";

export function useCurrentLaboratory() {
  const { getById } = useLaboratories();
  return getById(CURRENT_LABORATORY_ID);
}
