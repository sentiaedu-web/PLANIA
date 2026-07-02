export type AppLanguage = "es" | "ca" | "en";

export type SchoolStage = "Infantil" | "Primaria";

export interface SchoolSetup {
  language: AppLanguage;
  stage: SchoolStage;
  course: string;
  subject: string;
  schoolYear: string;
  locality: string;
  sessionsPerWeek: number;
  classDays: number[]; // 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday
}

export type IncidentType =
  | "holiday"       // Festivos locales
  | "bridge"        // Puentes
  | "excursion"     // Excursiones
  | "activity"      // Salidas complementarias
  | "cultural"      // Semana cultural
  | "special"       // Jornadas especiales
  | "other";        // Otros eventos

export interface CalendarIncident {
  id: string;
  type: IncidentType;
  name: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // Optional for multi-day events
}

export interface SdA {
  id: string;
  name: string;
  sessions: number;
  trimester: 1 | 2 | 3;
}

export interface TrimesterSummary {
  theoreticalSessions: number;
  lostSessions: number;
  availableSessions: number;
}

export interface SessionCalculation {
  theoreticalSessions: number;
  lostSessions: number;
  availableSessions: number;
  trimesterSessions: {
    t1: number;
    t2: number;
    t3: number;
  };
  lostSessionsList: {
    incidentId: string;
    name: string;
    type: IncidentType;
    date: string;
    sessionsLost: number;
    trimester: 1 | 2 | 3;
  }[];
}

export type ProgramMode = "A" | "B" | "C"; // A = Solo temporalización, B = Solo texto de Programación, C = Ambos
