import type { Laboratory } from "@/types/laboratory";

/**
 * Dados mockados. Futuramente substituídos por consulta ao backend.
 */
export const mockLaboratories: Laboratory[] = [
  {
    id: "1",
    name: "Laboratório de Informática 01",
    schoolName: "Indústria do Saber - Maués",
    responsible: "Maria Silva",
    email: "lab.maues@exemplo.com",
    phone: "(92) 99999-0001",
    city: "Maués",
    state: "AM",
    status: "ativo",
    createdAt: "2025-02-10",
  },
  {
    id: "2",
    name: "Laboratório de Informática 02",
    schoolName: "Unidade Centro",
    responsible: "Carlos Oliveira",
    email: "lab.centro@exemplo.com",
    phone: "(92) 99999-0002",
    city: "Manaus",
    state: "AM",
    status: "ativo",
    createdAt: "2025-04-22",
  },
  {
    id: "3",
    name: "Laboratório de Informática 03",
    schoolName: "Unidade Norte",
    responsible: "Ana Souza",
    email: "lab.norte@exemplo.com",
    phone: "(92) 99999-0003",
    city: "Manaus",
    state: "AM",
    status: "inativo",
    createdAt: "2025-06-05",
  },
  {
    id: "4",
    name: "Laboratório de Informática 04",
    schoolName: "Unidade Leste",
    responsible: "João Pereira",
    email: "lab.leste@exemplo.com",
    phone: "(92) 99999-0004",
    city: "Itacoatiara",
    state: "AM",
    status: "ativo",
    createdAt: "2025-07-14",
  },
  {
    id: "5",
    name: "Laboratório de Informática 05",
    schoolName: "Unidade Sul",
    responsible: "Beatriz Lima",
    email: "lab.sul@exemplo.com",
    phone: "(92) 99999-0005",
    city: "Parintins",
    state: "AM",
    status: "ativo",
    createdAt: "2025-08-01",
  },
];

export const mockDashboardStats = {
  total: 5,
  ativos: 4,
  inativos: 1,
  provasAgendadas: 126,
};

export const mockLaboratorySummary = {
  agendadas: 32,
  realizadas: 25,
  pendentes: 7,
  hoje: 3,
};
