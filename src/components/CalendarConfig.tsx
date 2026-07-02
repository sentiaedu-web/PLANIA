import React, { useState } from "react";
import { CalendarIncident, IncidentType, SchoolSetup } from "../types";
import { CalendarDays, Trash2, Plus, Calendar, AlertCircle, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { OFFICIAL_HOLIDAYS, SCHOOL_YEAR_START, SCHOOL_YEAR_END } from "../utils/calendar";

interface CalendarConfigProps {
  setup: SchoolSetup;
  incidents: CalendarIncident[];
  onAddIncident: (incident: CalendarIncident) => void;
  onRemoveIncident: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const IncidentTypes: { value: IncidentType; label: string; color: string }[] = [
  { value: "holiday", label: "Festivo Local", color: "bg-red-500 text-white" },
  { value: "bridge", label: "Puente", color: "bg-orange-500 text-white" },
  { value: "excursion", label: "Excursión", color: "bg-emerald-500 text-white" },
  { value: "activity", label: "Salida Complementaria", color: "bg-teal-500 text-white" },
  { value: "cultural", label: "Semana Cultural", color: "bg-purple-500 text-white" },
  { value: "special", label: "Jornada Especial", color: "bg-blue-500 text-white" },
  { value: "other", label: "Otros Eventos", color: "bg-slate-500 text-white" },
];

export function CalendarConfig({
  setup,
  incidents,
  onAddIncident,
  onRemoveIncident,
  onBack,
  onNext,
}: CalendarConfigProps) {
  const [type, setType] = useState<IncidentType>("holiday");
  const [name, setName] = useState("");
  const [date, setDate] = useState("2026-10-15");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor, introduzca un nombre descriptivo para el evento.");
      return;
    }

    if (!date) {
      setError("Por favor, seleccione una fecha.");
      return;
    }

    if (date < SCHOOL_YEAR_START || date > SCHOOL_YEAR_END) {
      setError(`La fecha debe estar dentro del curso escolar (${SCHOOL_YEAR_START} al ${SCHOOL_YEAR_END}).`);
      return;
    }

    if (endDate && endDate < date) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    if (endDate && endDate > SCHOOL_YEAR_END) {
      setError(`La fecha de fin debe estar dentro del curso escolar (hasta el ${SCHOOL_YEAR_END}).`);
      return;
    }

    // Add unique incident
    onAddIncident({
      id: "inc-" + Date.now(),
      type,
      name: name.trim(),
      date,
      endDate: endDate || undefined,
    });

    // Reset inputs
    setName("");
    setError("");
  };

  // Group official holidays by trimester
  const t1Official = OFFICIAL_HOLIDAYS.filter((h) => h.date <= "2026-12-22");
  const t2Official = OFFICIAL_HOLIDAYS.filter((h) => h.date >= "2027-01-01" && h.date <= "2027-03-31");
  const t3Official = OFFICIAL_HOLIDAYS.filter((h) => h.date >= "2027-04-01");

  // Filter unique names for listing official holidays nicely (e.g. grouping long Christmas/Easter lists)
  const renderOfficialList = (holidays: typeof OFFICIAL_HOLIDAYS) => {
    // Group identical holiday names to avoid showing 15 rows of "Vacaciones de Navidad"
    const grouped: { name: string; range: string }[] = [];
    const processedNames = new Set<string>();

    holidays.forEach((h) => {
      if (h.name.includes("Vacaciones")) {
        if (!processedNames.has(h.name)) {
          processedNames.add(h.name);
          const related = holidays.filter((x) => x.name === h.name).sort((a, b) => a.date.localeCompare(b.date));
          if (related.length > 0) {
            const startStr = new Date(related[0].date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
            const endStr = new Date(related[related.length - 1].date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            });
            grouped.push({ name: h.name, range: `${startStr} al ${endStr}` });
          }
        }
      } else {
        const dateStr = new Date(h.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        grouped.push({ name: h.name, range: dateStr });
      }
    });

    return (
      <ul className="space-y-1 text-xs text-slate-600 font-sans">
        {grouped.map((g, idx) => (
          <li key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
            <span>{g.name}</span>
            <span className="font-mono font-bold text-slate-500">{g.range}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title block */}
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">Paso 2 de 4</span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 font-sans tracking-tight">
            Configuración del Calendario e Incidencias
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            PlanIA CV descuenta automáticamente los festivos autonómicos de la Comunitat Valenciana. Añada sus festivos locales, puentes o excursiones específicas de su centro.
          </p>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: Add Custom incidents */}
          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarDays className="w-5 h-5 text-amber-500" /> Añadir Incidencia o Evento
            </h3>

            <form onSubmit={handleSubmitIncident} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tipo de Incidencia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {IncidentTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                        type === t.value
                          ? "bg-slate-900 border-slate-900 text-white shadow"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre descriptivo / Evento
                </label>
                <input
                  type="text"
                  placeholder="Ej. Fallas de Valencia, Excursión Museo, Semana Deportiva..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
                />
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    min={SCHOOL_YEAR_START}
                    max={SCHOOL_YEAR_END}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 text-slate-800 bg-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Fecha de Fin</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="date"
                    min={date || SCHOOL_YEAR_START}
                    max={SCHOOL_YEAR_END}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 text-slate-800 bg-white text-sm outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-lg border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm transition duration-200 hover:bg-amber-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Añadir al Calendario
              </button>
            </form>

            {/* Custom events list */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Tus incidencias configuradas ({incidents.length})</h4>
              {incidents.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 text-slate-500">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">No has añadido incidencias personalizadas.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Usa el formulario superior para añadir puentes, excursiones o festivos locales.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {incidents
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((inc) => {
                      const foundType = IncidentTypes.find((t) => t.value === inc.type);
                      const displayDate = inc.endDate
                        ? `${new Date(inc.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })} al ${new Date(inc.endDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}`
                        : new Date(inc.date).toLocaleDateString("es-ES", { day: "numeric", month: "long" });

                      return (
                        <div
                          key={inc.id}
                          className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all"
                        >
                          <div className="space-y-1.5 max-w-[80%]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800 leading-tight">{inc.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${foundType?.color || "bg-slate-100 text-slate-800"}`}>
                                {foundType?.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {displayDate}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveIncident(inc.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Official Holidays of Comunitat Valenciana */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Calendar className="w-4 h-4 text-slate-600" /> Festivos Oficiales de la CV
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              La Conselleria de Educación establece el calendario oficial del curso 2026-2027. Los siguientes períodos son inhábiles automáticos:
            </p>

            <div className="space-y-3.5">
              {/* T1 */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 bg-slate-200/60 px-2 py-1 rounded">1er Trimestre</h4>
                <div className="mt-1">{renderOfficialList(t1Official)}</div>
              </div>

              {/* T2 */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 bg-slate-200/60 px-2 py-1 rounded">2º Trimestre</h4>
                <div className="mt-1">{renderOfficialList(t2Official)}</div>
              </div>

              {/* T3 */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 bg-slate-200/60 px-2 py-1 rounded">3er Trimestre</h4>
                <div className="mt-1">{renderOfficialList(t3Official)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="border-t border-slate-200 p-6 sm:p-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 border border-slate-200 transition duration-150 flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition duration-150 flex items-center gap-2 cursor-pointer"
          >
            Siguiente: Gestionar SdAs <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
