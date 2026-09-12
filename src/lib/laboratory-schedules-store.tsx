import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mockLaboratorySchedules } from "@/data/laboratory-schedules";
import type { LaboratorySchedule, LaboratoryScheduleInput } from "@/types/laboratory-schedule";

interface LaboratorySchedulesContextValue {
  schedules: LaboratorySchedule[];
  listByLaboratory: (laboratoryId: string) => LaboratorySchedule[];
  replaceForLaboratory: (laboratoryId: string, values: LaboratoryScheduleInput[]) => void;
}

const LaboratorySchedulesContext = createContext<LaboratorySchedulesContextValue | null>(null);

export function LaboratorySchedulesProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<LaboratorySchedule[]>(mockLaboratorySchedules);

  const listByLaboratory = useCallback(
    (laboratoryId: string) =>
      schedules
        .filter((schedule) => schedule.laboratoryId === laboratoryId)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)),
    [schedules],
  );

  const replaceForLaboratory = useCallback(
    (laboratoryId: string, values: LaboratoryScheduleInput[]) => {
      const now = new Date().toISOString();
      const next = values.map((value, index) => ({
        id: `${laboratoryId}-${value.dayOfWeek}-${value.startTime}-${index}`,
        laboratoryId,
        ...value,
        createdAt: now,
        updatedAt: now,
      }));

      setSchedules((current) => [
        ...current.filter((schedule) => schedule.laboratoryId !== laboratoryId),
        ...next,
      ]);
    },
    [],
  );

  const value = useMemo(
    () => ({ schedules, listByLaboratory, replaceForLaboratory }),
    [schedules, listByLaboratory, replaceForLaboratory],
  );

  return (
    <LaboratorySchedulesContext.Provider value={value}>
      {children}
    </LaboratorySchedulesContext.Provider>
  );
}

export function useLaboratorySchedules() {
  const context = useContext(LaboratorySchedulesContext);
  if (!context) {
    throw new Error("useLaboratorySchedules deve ser usado dentro de LaboratorySchedulesProvider");
  }
  return context;
}
