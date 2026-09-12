import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockLaboratoryAccess } from "@/data/laboratory-access";
import type { LaboratoryAccess } from "@/types/laboratory";

interface LaboratoryAccessContextValue {
  accounts: LaboratoryAccess[];
  getByLaboratoryId: (laboratoryId: string) => LaboratoryAccess | undefined;
  upsert: (laboratoryId: string, email: string) => void;
}

const LaboratoryAccessContext = createContext<LaboratoryAccessContextValue | null>(null);

export function LaboratoryAccessProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<LaboratoryAccess[]>(mockLaboratoryAccess);

  const getByLaboratoryId = useCallback(
    (laboratoryId: string) => accounts.find((account) => account.laboratoryId === laboratoryId),
    [accounts],
  );

  const upsert = useCallback((laboratoryId: string, email: string) => {
    setAccounts((current) => {
      const exists = current.some((account) => account.laboratoryId === laboratoryId);
      return exists
        ? current.map((account) =>
            account.laboratoryId === laboratoryId ? { ...account, email } : account,
          )
        : [...current, { laboratoryId, email }];
    });
  }, []);

  const value = useMemo(
    () => ({ accounts, getByLaboratoryId, upsert }),
    [accounts, getByLaboratoryId, upsert],
  );

  return <LaboratoryAccessContext.Provider value={value}>{children}</LaboratoryAccessContext.Provider>;
}

export function useLaboratoryAccess() {
  const context = useContext(LaboratoryAccessContext);
  if (!context) throw new Error("useLaboratoryAccess deve ser usado dentro de LaboratoryAccessProvider");
  return context;
}
