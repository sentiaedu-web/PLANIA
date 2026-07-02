import { CalendarIncident, SessionCalculation } from "../types";

// Official school year bounds for Comunitat Valenciana 2026-2027
export const SCHOOL_YEAR_START = "2026-09-07";
export const SCHOOL_YEAR_END = "2027-06-18";

// Map date to its trimester
export function getTrimesterForDate(dateStr: string): 1 | 2 | 3 {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  if (year === 2026) {
    return 1; // September to December is always T1
  } else if (year === 2027) {
    if (month <= 3) {
      return 2; // Jan, Feb, March is T2
    } else {
      return 3; // April, May, June is T3
    }
  }
  return 1;
}

// Official autonomous/national holidays in Comunitat Valenciana for 2026-2027 school year
export const OFFICIAL_HOLIDAYS: { date: string; name: string }[] = [
  { date: "2026-10-09", name: "Día de la Comunitat Valenciana" },
  { date: "2026-10-12", name: "Fiesta Nacional de España (Hispanidad)" },
  { date: "2026-11-01", name: "Todos los Santos" },
  { date: "2026-12-06", name: "Día de la Constitución Española" },
  { date: "2026-12-07", name: "Día no lectivo (Puente de la Constitución)" },
  { date: "2026-12-08", name: "Inmaculada Concepción" },
  // Christmas break (Dec 23, 2026 to Jan 6, 2027 inclusive)
  ...Array.from({ length: 15 }, (_, i) => {
    const day = 23 + i;
    if (day <= 31) {
      return { date: `2026-12-${String(day).padStart(2, "0")}`, name: "Vacaciones de Navidad" };
    } else {
      const janDay = day - 31;
      return { date: `2027-01-${String(janDay).padStart(2, "0")}`, name: "Vacaciones de Navidad" };
    }
  }),
  { date: "2027-03-19", name: "San José (Fallas)" },
  // Easter/Pascua break (Apr 1, 2027 to Apr 12, 2027 inclusive)
  ...Array.from({ length: 12 }, (_, i) => {
    const day = 1 + i;
    return { date: `2027-04-${String(day).padStart(2, "0")}`, name: "Vacaciones de Pascua" };
  }),
  { date: "2027-05-01", name: "Fiesta del Trabajo" },
];

// Calculate session breakdown
export function calculateSessions(
  classDays: number[], // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  incidents: CalendarIncident[]
): SessionCalculation {
  const start = new Date(SCHOOL_YEAR_START);
  const end = new Date(SCHOOL_YEAR_END);

  let theoreticalSessions = 0;
  let t1Theo = 0;
  let t2Theo = 0;
  let t3Theo = 0;

  const officialHolidaysSet = new Set(OFFICIAL_HOLIDAYS.map((h) => h.date));
  const officialHolidaysMap = new Map(OFFICIAL_HOLIDAYS.map((h) => [h.date, h.name]));

  // Track lost sessions details
  const lostSessionsList: SessionCalculation["lostSessionsList"] = [];

  // Parse incidents to expand dates
  const incidentDatesMap = new Map<string, CalendarIncident>();
  incidents.forEach((inc) => {
    if (inc.endDate) {
      let curr = new Date(inc.date);
      const incEnd = new Date(inc.endDate);
      while (curr <= incEnd) {
        const dateStr = curr.toISOString().split("T")[0];
        incidentDatesMap.set(dateStr, inc);
        curr.setDate(curr.getDate() + 1);
      }
    } else {
      incidentDatesMap.set(inc.date, inc);
    }
  });

  // Loop through all calendar days
  let current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dateStr = current.toISOString().split("T")[0];
    const trimester = getTrimesterForDate(dateStr);

    // Is it a configured class day? (and not a weekend)
    if (classDays.includes(dayOfWeek) && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // It's a theoretical session day!
      theoreticalSessions++;
      if (trimester === 1) t1Theo++;
      else if (trimester === 2) t2Theo++;
      else if (trimester === 3) t3Theo++;

      // Check if it's lost due to official holidays
      if (officialHolidaysSet.has(dateStr)) {
        lostSessionsList.push({
          incidentId: "official-" + dateStr,
          name: officialHolidaysMap.get(dateStr) || "Festivo Oficial",
          type: "holiday",
          date: dateStr,
          sessionsLost: 1,
          trimester,
        });
      }
      // Check if it's lost due to user incident
      else if (incidentDatesMap.has(dateStr)) {
        const incident = incidentDatesMap.get(dateStr)!;
        lostSessionsList.push({
          incidentId: incident.id,
          name: incident.name,
          type: incident.type,
          date: dateStr,
          sessionsLost: 1,
          trimester,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Calculate actual totals
  const totalLost = lostSessionsList.length;
  const availableSessions = theoreticalSessions - totalLost;

  // Trimester specific totals
  const t1Lost = lostSessionsList.filter((l) => l.trimester === 1).length;
  const t2Lost = lostSessionsList.filter((l) => l.trimester === 2).length;
  const t3Lost = lostSessionsList.filter((l) => l.trimester === 3).length;

  return {
    theoreticalSessions,
    lostSessions: totalLost,
    availableSessions,
    trimesterSessions: {
      t1: t1Theo - t1Lost,
      t2: t2Theo - t2Lost,
      t3: t3Theo - t3Lost,
    },
    lostSessionsList,
  };
}
