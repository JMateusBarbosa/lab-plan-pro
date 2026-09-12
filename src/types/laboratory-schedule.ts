export interface LaboratorySchedule {
  id: string;
  laboratoryId: string;
  dayOfWeek: number; // 0 = domingo, 6 = sábado
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LaboratoryScheduleInput = Pick<
  LaboratorySchedule,
  "dayOfWeek" | "startTime" | "endTime" | "active"
>;

export const dayOfWeekLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

export function getDayOfWeekFromDate(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}
