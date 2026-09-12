import type { Laboratory } from "@/types/laboratory";

/** Dados mockados até a integração completa com o Supabase. */
export const mockLaboratories: Laboratory[] = [
  {
    id: "1",
    name: "Laboratório de Informática 01",
    schoolName: "Indústria do Saber - Maués",
    responsible: "Maria Silva",
    phone: "(92) 99999-0001",
    city: "Maués",
    state: "AM",
    status: "ativo",
    computerCount: 14,
    createdAt: "2025-02-10",
  },
  {
    id: "2",
    name: "Laboratório de Informática 02",
    schoolName: "Unidade Centro",
    responsible: "Carlos Oliveira",
    phone: "(92) 99999-0002",
    city: "Manaus",
    state: "AM",
    status: "ativo",
    computerCount: 8,
    createdAt: "2025-04-22",
  },
  {
    id: "3",
    name: "Laboratório de Informática 03",
    schoolName: "Unidade Norte",
    responsible: "Ana Souza",
    phone: "(92) 99999-0003",
    city: "Manaus",
    state: "AM",
    status: "inativo",
    computerCount: 20,
    createdAt: "2025-06-05",
  },
];

export const mockDashboardStats = {
  total: 3,
  ativos: 2,
  inativos: 1,
  provasAgendadas: 15,
};
