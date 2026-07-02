import React, { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { SetupForm } from "./components/SetupForm";
import { CalendarConfig } from "./components/CalendarConfig";
import { SdaManager } from "./components/SdaManager";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { AboutSection } from "./components/AboutSection";
import { SchoolSetup, CalendarIncident, SdA, AppLanguage } from "./types";
import { calculateSessions } from "./utils/calendar";
import { Settings, Calendar, Layers, FileText, CheckCircle, ShieldAlert, BookOpen } from "lucide-react";
import { exportToWord, exportToExcel } from "./utils/exporters";
import { DriveIntegration } from "./components/DriveIntegration";
import { SelectedReference } from "./utils/drive";

// Pre-configured realistic default values to make testing instantaneous and informative
const DEFAULT_SETUP: SchoolSetup = {
  language: "es",
  stage: "Primaria",
  course: "5.º Primaria",
  subject: "Lengua Castellana y Literatura",
  schoolYear: "2026-2027",
  locality: "Valencia",
  sessionsPerWeek: 3,
  classDays: [1, 3, 5], // Lunes, Miércoles, Viernes
};

const DEFAULT_INCIDENTS: CalendarIncident[] = [
  {
    id: "inc-1",
    type: "holiday",
    name: "Festivo Local: San Vicente Mártir",
    date: "2027-01-22",
  },
  {
    id: "inc-2",
    type: "excursion",
    name: "Visita al Oceanogràfic de Valencia",
    date: "2026-11-20",
  },
  {
    id: "inc-3",
    type: "activity",
    name: "Teatro en Inglés (Centro Cultural)",
    date: "2027-02-12",
  },
  {
    id: "inc-4",
    type: "bridge",
    name: "Puente del Día de San José",
    date: "2027-03-18",
  },
];

const DEFAULT_SDAS: SdA[] = [
  {
    id: "sda-1",
    name: "Palabras que conectan mundos",
    sessions: 15,
    trimester: 1,
  },
  {
    id: "sda-2",
    name: "Periodistas en acción: El periódico escolar",
    sessions: 18,
    trimester: 2,
  },
  {
    id: "sda-3",
    name: "El gran teatro de la vida: Representamos una obra",
    sessions: 12,
    trimester: 3,
  },
];

export default function App() {
  const [step, setStep] = useState<number>(0); // 0 = Setup, 1 = Calendar, 2 = SdA, 3 = Results
  const [setup, setSetup] = useState<SchoolSetup>(DEFAULT_SETUP);
  const [incidents, setIncidents] = useState<CalendarIncident[]>(DEFAULT_INCIDENTS);
  const [sdas, setSdas] = useState<SdA[]>(DEFAULT_SDAS);
  const [observations, setObservations] = useState("");
  const [aiText, setAiText] = useState("");
  const [selectedReferences, setSelectedReferences] = useState<SelectedReference[]>([]);

  // Dynamically compute the sessions summary based on schedule and incidents
  const sessionsSummary = useMemo(() => {
    return calculateSessions(setup.classDays, incidents);
  }, [setup.classDays, incidents]);

  // Stepper steps config
  const steps = [
    { label: "Configuración", icon: Settings },
    { label: "Calendario", icon: Calendar },
    { label: "Situaciones de Aprendizaje", icon: Layers },
    { label: "Resultados", icon: FileText },
  ];

  const handleExportDocx = () => {
    exportToWord(setup, sessionsSummary, sdas, observations, aiText);
  };

  const handleExportXlsx = () => {
    exportToExcel(setup, sessionsSummary, sdas, observations);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* 1. SIDEBAR (Aside) - Hidden on mobile, visible on desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 hidden md:flex h-full overflow-y-auto">
        <div className="p-6 flex flex-col gap-1 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-amber-500 text-slate-950 p-1.5 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-amber-500">PLANIA CV</h1>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">
            Sentia: Sentir, enseñar, transformar
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 mb-2 tracking-wider">
            Planificación
          </div>
          {[
            { label: "Panel de Control", icon: Settings },
            { label: "Configuración Calendario", icon: Calendar },
            { label: "Situaciones de Aprendizaje", icon: Layers },
            { label: "Memoria Programación", icon: FileText },
          ].map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === step;
            return (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-xl font-medium transition-all duration-150 cursor-pointer text-left ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                <span>{s.label}</span>
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 mt-6 mb-2 tracking-wider">
            Exportar
          </div>
          <div className="flex gap-2 px-3 mt-1">
            <button
              onClick={handleExportDocx}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm text-center"
            >
              Word
            </button>
            <button
              onClick={handleExportXlsx}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm text-center"
            >
              Excel
            </button>
          </div>
        </nav>

        {/* Security Notice */}
        <div className="p-4 mx-4 mb-4 bg-slate-950/40 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5 text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Aviso de Seguridad</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
            No introduzca datos personales del alumnado. PlanIA CV trabaja exclusivamente con información curricular y organizativa según el Reglamento (UE) 2016/679.
          </p>
        </div>

        {/* Trazabilidad Normativa */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider font-mono">Trazabilidad Normativa</span>
          </div>
          <ul className="text-[10px] text-slate-400 space-y-1 list-none pl-0">
            {setup.stage === "Infantil" ? (
              <li>✓ Decreto 100/2022 (Infantil)</li>
            ) : (
              <>
                <li>✓ Decreto 106/2022 (Primaria)</li>
                <li>✓ Decreto 96/2026 (Actualización)</li>
              </>
            )}
            <li>✓ Calendario Escolar 26/27</li>
          </ul>
        </div>
        <div className="p-4 text-[9px] text-slate-500 opacity-65 italic border-t border-slate-800/50 text-center font-mono">
          Autor: David Martínez López · v1.0
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar (Desktop Only) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 hidden md:flex">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Etapa y Curso</span>
              <span className="text-xs font-bold text-slate-800">{setup.stage} — {setup.course}</span>
            </div>
            <div className="flex flex-col border-l border-slate-200 pl-8">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Área / Materia</span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{setup.subject}</span>
            </div>
            <div className="flex flex-col border-l border-slate-200 pl-8">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Localidad</span>
              <span className="text-xs font-bold text-slate-800">{setup.locality} (Comunitat Valenciana)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector in Header */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Idioma de salida:</span>
              <select
                value={setup.language}
                onChange={(e) => setSetup((prev) => ({ ...prev, language: e.target.value as AppLanguage }))}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-800 font-semibold cursor-pointer shadow-sm transition-all"
              >
                <option value="es">Castellano</option>
                <option value="ca">Valencià (AVL)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </header>

        {/* Mobile Header (Mobile Only) */}
        <header className="bg-slate-900 text-white flex md:hidden flex-col shrink-0 shadow-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span className="font-bold tracking-tight text-amber-500 text-base">PLANIA CV</span>
            </div>
            {/* Language Selector on Mobile */}
            <select
              value={setup.language}
              onChange={(e) => setSetup((prev) => ({ ...prev, language: e.target.value as AppLanguage }))}
              className="text-xs border border-slate-700 rounded bg-slate-800 text-white px-2 py-1 outline-none font-semibold cursor-pointer"
            >
              <option value="es">Castellano</option>
              <option value="ca">Valencià (AVL)</option>
              <option value="en">English</option>
            </select>
          </div>
          {/* Quick info bar on mobile */}
          <div className="bg-slate-950 px-4 py-2 text-[10px] text-slate-400 flex justify-between gap-2 overflow-x-auto whitespace-nowrap">
            <span>{setup.stage} • {setup.course}</span>
            <span>{setup.subject}</span>
            <span>{setup.locality}</span>
          </div>
        </header>

        {/* Scrollable View Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 bg-slate-50">
          {/* Permanent Data Protection alert on top of main content for mobile */}
          <div className="md:hidden flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-relaxed">
              <strong className="text-amber-800">Aviso de seguridad permanente:</strong> No introduzca datos personales del alumnado. PlanIA CV trabaja exclusivamente con información curricular y organizativa.
            </p>
          </div>

          {/* Elegant Stepper Navigation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-center justify-between relative">
              {/* Visual connector line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0 hidden md:block" />

              {steps.map((s, idx) => {
                const StepIcon = s.icon;
                const isCompleted = idx < step;
                const isActive = idx === step;

                return (
                  <div
                    key={idx}
                    onClick={() => setStep(idx)}
                    className="flex flex-col items-center text-center relative z-10 cursor-pointer select-none group transition-all duration-200"
                    style={{ width: "25%" }}
                  >
                    {/* Stepper Node Bubble */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                        isCompleted
                          ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm"
                          : isActive
                            ? "bg-slate-900 border-slate-900 text-white ring-4 ring-amber-500/20"
                            : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5 font-bold" /> : <StepIcon className="w-4 h-4" />}
                    </div>

                    {/* Stepper Label */}
                    <span
                      className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                        isActive ? "text-slate-900 font-bold" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Views Container */}
          <div className="transition-all duration-300 max-w-4xl mx-auto">
            {step === 0 && (
              <div className="space-y-6">
                <SetupForm
                  initialSetup={setup}
                  onSubmit={(newSetup) => {
                    setSetup(newSetup);
                    setStep(1);
                  }}
                />
                
                <DriveIntegration
                  selectedReferences={selectedReferences}
                  setSelectedReferences={setSelectedReferences}
                />
              </div>
            )}

            {step === 1 && (
              <CalendarConfig
                setup={setup}
                incidents={incidents}
                onAddIncident={(newInc) => setIncidents((prev) => [...prev, newInc])}
                onRemoveIncident={(id) => setIncidents((prev) => prev.filter((i) => i.id !== id))}
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <SdaManager
                calc={sessionsSummary}
                sdas={sdas}
                onAddSda={(newSda) => setSdas((prev) => [...prev, newSda])}
                onRemoveSda={(id) => setSdas((prev) => prev.filter((s) => s.id !== id))}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <ResultsDashboard
                setup={setup}
                calc={sessionsSummary}
                sdas={sdas}
                onBack={() => setStep(2)}
                observations={observations}
                setObservations={setObservations}
                aiText={aiText}
                setAiText={setAiText}
                selectedReferences={selectedReferences}
              />
            )}
          </div>

          {/* Footer Author & About Information (VITAL) */}
          <div className="max-w-4xl mx-auto">
            <AboutSection />
          </div>

          {/* Mobile Footer */}
          <footer className="md:hidden bg-white border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 font-mono">
            <p>© 2026 PlanIA CV. Todos los derechos reservados.</p>
            <p className="mt-1 text-[10px] text-slate-400">
              Sentia: Sentir, enseñar, transformar. Creado para la planificación docente en la Comunitat Valenciana.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
