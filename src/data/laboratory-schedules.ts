import type { LaboratorySchedule } from "@/types/laboratory-schedule";

const now = "2026-09-12";

export const mockLaboratorySchedules: LaboratorySchedule[] = [
  // Laboratório 1 - segunda a quinta
  ...[1, 2, 3, 4].flatMap((dayOfWeek) => [
    { id: `l1-${dayOfWeek}-0730`, laboratoryId: "1", dayOfWeek, startTime: "07:30", endTime: "08:30", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-0830`, laboratoryId: "1", dayOfWeek, startTime: "08:30", endTime: "09:30", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-0930`, laboratoryId: "1", dayOfWeek, startTime: "09:30", endTime: "10:30", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-1400`, laboratoryId: "1", dayOfWeek, startTime: "14:00", endTime: "15:00", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-1500`, laboratoryId: "1", dayOfWeek, startTime: "15:00", endTime: "16:00", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-1600`, laboratoryId: "1", dayOfWeek, startTime: "16:00", endTime: "17:00", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-1700`, laboratoryId: "1", dayOfWeek, startTime: "17:00", endTime: "18:00", active: true, createdAt: now, updatedAt: now },
    { id: `l1-${dayOfWeek}-1800`, laboratoryId: "1", dayOfWeek, startTime: "18:00", endTime: "19:00", active: true, createdAt: now, updatedAt: now },
  ]),
  // Laboratório 1 - sábado
  { id: "l1-6-0730", laboratoryId: "1", dayOfWeek: 6, startTime: "07:30", endTime: "09:30", active: true, createdAt: now, updatedAt: now },
  { id: "l1-6-0930", laboratoryId: "1", dayOfWeek: 6, startTime: "09:30", endTime: "11:30", active: true, createdAt: now, updatedAt: now },
  { id: "l1-6-1400", laboratoryId: "1", dayOfWeek: 6, startTime: "14:00", endTime: "16:00", active: true, createdAt: now, updatedAt: now },
  { id: "l1-6-1600", laboratoryId: "1", dayOfWeek: 6, startTime: "16:00", endTime: "18:00", active: true, createdAt: now, updatedAt: now },

  // Exemplos para outros laboratórios
  { id: "l2-1-0800", laboratoryId: "2", dayOfWeek: 1, startTime: "08:00", endTime: "09:00", active: true, createdAt: now, updatedAt: now },
  { id: "l2-1-1400", laboratoryId: "2", dayOfWeek: 1, startTime: "14:00", endTime: "15:00", active: true, createdAt: now, updatedAt: now },
  { id: "l3-2-0730", laboratoryId: "3", dayOfWeek: 2, startTime: "07:30", endTime: "09:30", active: true, createdAt: now, updatedAt: now },
];
