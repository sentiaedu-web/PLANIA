import React, { useState } from "react";
import { SdA, SessionCalculation } from "../types";
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Layers, HelpCircle } from "lucide-react";

interface SdaManagerProps {
  calc: SessionCalculation;
  sdas: SdA[];
  onAddSda: (sda: SdA) => void;
  onRemoveSda: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SdaManager({ calc, sdas, onAddSda, onRemoveSda, onBack, onNext }: SdaManagerProps) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState<number>(8);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState("");

  const totalAssigned = sdas.reduce((sum, s) => sum + s.sessions, 0);
  const remaining = calc.availableSessions - totalAssigned;

  const handleAddSda = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor, introduzca un título para la Situación de Aprendizaje.");
      return;
    }

    if (sessions <= 0) {
      setError("El número de sesiones debe ser mayor que 0.");
      return;
    }

    onAddSda({
      id: "sda-" + Date.now(),
      name: name.trim(),
      sessions,
      trimester,
    });

    setName("");
  };

  // AUTOMATIC VALIDATIONS
  const warnings: string[] = [];
  const successes: string[] = [];

  // 1. Exceso de sesiones
  if (totalAssigned > calc.availableSessions) {
    warnings.push("Las sesiones asignadas superan las sesiones disponibles.");
  }

  // 2. Déficit de sesiones
  if (totalAssigned < calc.availableSessions) {
    warnings.push("Existen sesiones sin asignar.");
  } else if (totalAssigned === calc.availableSessions) {
    successes.push("¡Perfecto! Todas las sesiones disponibles han sido asignadas exactamente.");
  }

  // 3. Desequilibrio trimestral
  // Let's compute proportion of planned vs available in each trimester
  const t1Planned = sdas.filter((s) => s.trimester === 1).reduce((sum, s) => sum + s.sessions, 0);
  const t2Planned = sdas.filter((s) => s.trimester === 2).reduce((sum, s) => sum + s.sessions, 0);
  const t3Planned = sdas.filter((s) => s.trimester === 3).reduce((sum, s) => sum + s.sessions, 0);

  const t1Ratio = calc.trimesterSessions.t1 > 0 ? t1Planned / calc.trimesterSessions.t1 : 0;
  const t2Ratio = calc.trimesterSessions.t2 > 0 ? t2Planned / calc.trimesterSessions.t2 : 0;
  const t3Ratio = calc.trimesterSessions.t3 > 0 ? t3Planned / calc.trimesterSessions.t3 : 0;

  const ratios = [t1Ratio, t2Ratio, t3Ratio].filter((r) => r > 0);
  if (ratios.length > 0) {
    const maxRatio = Math.max(...ratios);
    const minRatio = Math.min(...ratios);
    // If there is a high variance in how full the trimesters are
    if (maxRatio - minRatio > 0.4 && totalAssigned > 0) {
      warnings.push("La distribución entre trimestres es desequilibrada.");
    }
  }

  // 4. SdA excesivamente larga
  const longSdaThreshold = calc.availableSessions * 0.3; // 30% of total course
  const hasLongSda = sdas.some((s) => s.sessions > longSdaThreshold);
  if (hasLongSda) {
    warnings.push("Esta Situación de Aprendizaje ocupa una parte excesiva del curso.");
  }

  // Visual Trimester styling configurations
  const trimesterStyles = {
    1: {
      badge: "bg-amber-500 text-white",
      bg: "bg-amber-50 hover:bg-amber-100/50",
      border: "border-amber-200",
      text: "text-amber-800",
      progress: "bg-amber-500",
    },
    2: {
      badge: "bg-cyan-500 text-white",
      bg: "bg-cyan-50 hover:bg-cyan-100/50",
      border: "border-cyan-200",
      text: "text-cyan-800",
      progress: "bg-cyan-500",
    },
    3: {
      badge: "bg-emerald-500 text-white",
      bg: "bg-emerald-50 hover:bg-emerald-100/50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      progress: "bg-emerald-500",
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Visual Header card */}
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">Paso 3 de 4</span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 font-sans tracking-tight">
            Distribución de las Situaciones de Aprendizaje (SdA)
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Asigne sus Situaciones de Aprendizaje al calendario. Introduzca sus nombres y defina el número de sesiones necesarias para cada una.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Progress Bar and Summary Stats */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Carga Lectiva Asignada</h3>
                <p className="text-xs text-slate-500">
                  Total acumulado de las sesiones distribuidas frente a las disponibles reales.
                </p>
              </div>
              <div className="text-right font-mono text-sm">
                <span className="font-bold text-slate-900">{totalAssigned}</span> /{" "}
                <span className="text-slate-500">{calc.availableSessions}</span> sesiones
              </div>
            </div>

            {/* Standard full progress bar */}
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (t1Planned / (calc.availableSessions || 1)) * 100)}%` }}
                title={`T1: ${t1Planned} sesiones`}
              />
              <div
                className="bg-cyan-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (t2Planned / (calc.availableSessions || 1)) * 100)}%` }}
                title={`T2: ${t2Planned} sesiones`}
              />
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (t3Planned / (calc.availableSessions || 1)) * 100)}%` }}
                title={`T3: ${t3Planned} sesiones`}
              />
            </div>

            {/* Trimester breakdown legends */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px] font-sans border-t border-slate-200/60 pt-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <span className="font-semibold text-slate-700">1er Trimestre</span>
                </div>
                <span className="font-mono text-slate-500 mt-0.5">
                  {t1Planned} / {calc.trimesterSessions.t1} ses.
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                  <span className="font-semibold text-slate-700">2º Trimestre</span>
                </div>
                <span className="font-mono text-slate-500 mt-0.5">
                  {t2Planned} / {calc.trimesterSessions.t2} ses.
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="font-semibold text-slate-700">3er Trimestre</span>
                </div>
                <span className="font-mono text-slate-500 mt-0.5">
                  {t3Planned} / {calc.trimesterSessions.t3} ses.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form to Add SdA (LIGADO EXCLUSIVAMENTE AL USUARIO) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-slate-700" /> Nueva SdA
              </h3>

              <form onSubmit={handleAddSda} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Título de la SdA <span className="text-slate-400 font-normal">(Introducido exclusivamente por usted)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El agua que nos rodea, Los seres vivos..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nº de Sesiones
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={sessions}
                      onChange={(e) => setSessions(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 text-slate-800 bg-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Trimestre
                    </label>
                    <select
                      value={trimester}
                      onChange={(e) => setTrimester(parseInt(e.target.value) as 1 | 2 | 3)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:border-amber-500 text-slate-800 bg-white text-sm outline-none cursor-pointer"
                    >
                      <option value={1}>1er Trimestre</option>
                      <option value={2}>2º Trimestre</option>
                      <option value={3}>3er Trimestre</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 p-2.5 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm transition duration-200 hover:bg-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Añadir Situación de Aprendizaje
                </button>
              </form>
            </div>

            {/* List of existing SdAs */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Tus Situaciones de Aprendizaje registradas ({sdas.length})</h3>

              {sdas.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center bg-slate-50 text-slate-500">
                  <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-semibold">Ninguna SdA configurada aún</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Defina y distribuya sus Situaciones de Aprendizaje utilizando el panel lateral para empezar a estructurar la temporalización anual.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {sdas.map((sda, index) => {
                    const styles = trimesterStyles[sda.trimester];
                    return (
                      <div
                        key={sda.id}
                        className={`flex items-center justify-between p-4 border rounded-xl shadow-sm transition-all ${styles.bg} ${styles.border}`}
                      >
                        <div className="space-y-1 max-w-[80%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-400 uppercase">SdA {index + 1}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                              {sda.trimester}er Trimestre
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">{sda.name}</h4>
                          <p className="text-xs text-slate-500">
                            <strong>{sda.sessions}</strong> sesiones lectivas asignadas
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveSda(sda.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200/80 shadow-none hover:shadow-sm cursor-pointer"
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

          {/* REAL-TIME VALIDATIONS PANEL (VITAL) */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              Validador Automático de Coherencia Pedagógica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Warnings */}
              {warnings.map((warn, index) => (
                <div
                  key={"warn-" + index}
                  className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">Advertencia</h5>
                    <p className="text-xs mt-0.5 font-medium leading-relaxed">{warn}</p>
                  </div>
                </div>
              ))}

              {/* Successes */}
              {successes.map((succ, index) => (
                <div
                  key={"succ-" + index}
                  className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl md:col-span-2"
                >
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Validado</h5>
                    <p className="text-xs mt-0.5 font-medium leading-relaxed">{succ}</p>
                  </div>
                </div>
              ))}

              {warnings.length === 0 && successes.length === 0 && (
                <div className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200/60 rounded-xl p-3 md:col-span-2 text-center">
                  Introduzca y planifique Situaciones de Aprendizaje para activar el motor de validación pedagógica.
                </div>
              )}
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
            <ArrowLeft className="w-4 h-4" /> Volver al Calendario
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition duration-150 flex items-center gap-2 cursor-pointer"
          >
            Siguiente: Ver Resultados &amp; Programación <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
