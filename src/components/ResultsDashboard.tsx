import React, { useState } from "react";
import { SchoolSetup, SessionCalculation, SdA, ProgramMode } from "../types";
import { exportToWord, exportToExcel } from "../utils/exporters";
import { SelectedReference } from "../utils/drive";
import {
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Calendar,
  CheckSquare,
  HelpCircle,
  Clock,
  ChevronDown,
  FileCheck2,
} from "lucide-react";

interface ResultsDashboardProps {
  setup: SchoolSetup;
  calc: SessionCalculation;
  sdas: SdA[];
  onBack: () => void;
  observations: string;
  setObservations: (val: string) => void;
  aiText: string;
  setAiText: (val: string) => void;
  selectedReferences: SelectedReference[];
}

export function ResultsDashboard({
  setup,
  calc,
  sdas,
  onBack,
  observations,
  setObservations,
  aiText,
  setAiText,
  selectedReferences,
}: ResultsDashboardProps) {
  const [mode, setMode] = useState<ProgramMode>("C"); // C = Ambos by default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalSdaSessions = sdas.reduce((sum, s) => sum + s.sessions, 0);

  // Auto-validations for warnings in summary
  const warnings: string[] = [];
  if (totalSdaSessions > calc.availableSessions) {
    warnings.push("Las sesiones asignadas superan las sesiones disponibles.");
  }
  if (totalSdaSessions < calc.availableSessions) {
    warnings.push("Existen sesiones sin asignar.");
  }
  const longSdaThreshold = calc.availableSessions * 0.3;
  const hasLongSda = sdas.some((s) => s.sessions > longSdaThreshold);
  if (hasLongSda) {
    warnings.push("Esta Situación de Aprendizaje ocupa una parte excesiva del curso.");
  }

  // Trigger Gemini AI generation on the server-side
  const handleGenerateText = async () => {
    setLoading(true);
    setError("");
    setAiText("");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: setup.language,
          stage: setup.stage,
          course: setup.course,
          subject: setup.subject,
          schoolYear: setup.schoolYear,
          locality: setup.locality,
          summary: {
            theoreticalSessions: calc.theoreticalSessions,
            lostSessions: calc.lostSessions,
            availableSessions: calc.availableSessions,
            trimesterSessions: calc.trimesterSessions,
          },
          sdas: sdas,
          references: selectedReferences
            .filter((ref) => ref.status === "loaded")
            .map((ref) => ({
              name: ref.name,
              mimeType: ref.mimeType,
              content: ref.content,
            })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiText(data.text);
      } else {
        setError(data.error || "Ocurrió un error al generar la programación.");
      }
    } catch (err: any) {
      console.error(err);
      setError("No se pudo conectar con el servidor para la generación con IA.");
    } finally {
      setLoading(false);
    }
  };

  // Safe manual markdown parser/renderer
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1.5 border-l-2 border-amber-500 pl-2">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-lg font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200">
            {trimmed.replace("## ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={idx} className="text-xl font-extrabold text-slate-900 mt-6 mb-3">
            {trimmed.replace("# ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-sm text-slate-700 my-1 leading-relaxed">
            {trimmed.substring(2)}
          </li>
        );
      }
      if (trimmed.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-5 list-decimal text-sm text-slate-700 my-1 leading-relaxed">
            {trimmed.replace(/^\d+\.\s/, "")}
          </li>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-700 leading-relaxed my-2 text-justify">
          {line}
        </p>
      );
    });
  };

  // Exporters handlers
  const handleExportDocx = () => {
    exportToWord(setup, calc, sdas, observations, aiText);
  };

  const handleExportXlsx = () => {
    exportToExcel(setup, calc, sdas, observations);
  };

  const t1Planned = sdas.filter((s) => s.trimester === 1).reduce((sum, s) => sum + s.sessions, 0);
  const t2Planned = sdas.filter((s) => s.trimester === 2).reduce((sum, s) => sum + s.sessions, 0);
  const t3Planned = sdas.filter((s) => s.trimester === 3).reduce((sum, s) => sum + s.sessions, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">Paso 4 de 4</span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Resultados y Propuesta de Programación
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {setup.subject} — {setup.course} ({setup.stage})
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportDocx}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-150 shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4" /> 📄 Exportar DOCX
            </button>
            <button
              onClick={handleExportXlsx}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition duration-150 shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> 📊 Exportar XLSX
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Summary and Temporalization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Executive Session Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-5 h-5 text-amber-500" /> Resumen Ejecutivo de Sesiones
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">
                  Teóricas
                </span>
                <strong className="text-2xl font-bold text-slate-800 block mt-1">{calc.theoreticalSessions}</strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Según calendario</span>
              </div>
              <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl text-center">
                <span className="text-[10px] text-rose-500 uppercase tracking-wider font-mono font-bold block">
                  Descontadas
                </span>
                <strong className="text-2xl font-bold text-rose-700 block mt-1">-{calc.lostSessions}</strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Incidencias/Festivos</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-center shadow-sm">
                <span className="text-[10px] text-amber-800 uppercase tracking-wider font-mono font-bold block">
                  Disponibles
                </span>
                <strong className="text-2xl font-bold text-amber-900 block mt-1">{calc.availableSessions}</strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block">Sesiones reales</span>
              </div>
            </div>

            {/* Trimester Distribution */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Distribución Trimestral de Sesiones Reales
              </h4>

              <div className="space-y-2.5">
                {/* T1 */}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <strong>Primer Trimestre</strong>
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong>{t1Planned}</strong> / {calc.trimesterSessions.t1} sesiones ({Math.round((t1Planned / (calc.trimesterSessions.t1 || 1)) * 100)}% asignado)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (t1Planned / (calc.trimesterSessions.t1 || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* T2 */}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full" />
                      <strong>Segundo Trimestre</strong>
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong>{t2Planned}</strong> / {calc.trimesterSessions.t2} sesiones ({Math.round((t2Planned / (calc.trimesterSessions.t2 || 1)) * 100)}% asignado)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (t2Planned / (calc.trimesterSessions.t2 || 1)) * 100)}%` }} />
                  </div>
                </div>

                {/* T3 */}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <strong>Tercer Trimestre</strong>
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong>{t3Planned}</strong> / {calc.trimesterSessions.t3} sesiones ({Math.round((t3Planned / (calc.trimesterSessions.t3 || 1)) * 100)}% asignado)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (t3Planned / (calc.trimesterSessions.t3 || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Temporalization / List of SdAs */}
          {(mode === "A" || mode === "C") && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckSquare className="w-5 h-5 text-amber-500" /> Temporalización Anual de las SdA
              </h3>

              {sdas.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  No hay Situaciones de Aprendizaje planificadas para mostrar.
                </p>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {sdas.map((sda, index) => {
                    const colors = {
                      1: "border-l-4 border-l-amber-500",
                      2: "border-l-4 border-l-cyan-500",
                      3: "border-l-4 border-l-emerald-500",
                    };
                    return (
                      <div key={sda.id} className={`p-4 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 ${colors[sda.trimester]}`}>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            SdA {index + 1} • {sda.trimester}er Trimestre
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 mt-0.5">{sda.name}</h4>
                        </div>
                        <div className="text-right font-mono text-xs shrink-0 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                          <span className="font-bold text-slate-900">{sda.sessions}</span> sesiones
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Observations Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              Observaciones Organizativas Adicionales
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Escriba observaciones o anotaciones específicas sobre el centro escolar, necesidades o adaptaciones para que se incluyan formalmente en el documento Word exportado.
            </p>
            <textarea
              rows={3}
              placeholder="Ej. El primer trimestre cuenta con la semana cultural en la que se restará una sesión lectiva de Lengua..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-amber-500 text-sm outline-none bg-slate-50/50 resize-none"
            />
          </div>
        </div>

        {/* Right Side: Regulatory Trace, Warnings & AI Programming Generation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trazabilidad Normativa (REQUIRED) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-slate-700" /> Trazabilidad Normativa Oficial
            </h3>

            <div className="space-y-2 text-xs text-slate-700 font-medium">
              {setup.stage === "Infantil" ? (
                <div className="flex items-start gap-2 text-emerald-800">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Decreto 100/2022:</strong> Ordenación y currículo de Infantil Comunitat Valenciana.</span>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Decreto 106/2022:</strong> Ordenación y currículo de Primaria Comunitat Valenciana.</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-800">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Decreto 96/2026:</strong> Actualización curricular de Primaria Comunitat Valenciana.</span>
                  </div>
                </>
              )}
              <div className="flex items-start gap-2 text-emerald-800">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Calendario Escolar 2026-2027:</strong> Conselleria de Educación Comunitat Valenciana.</span>
              </div>
            </div>

            {/* Disclaimer for pending instructions of organization and functioning (REQUIRED) */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" /> Instrucciones de Organización Pendientes
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed text-justify">
                Las Instrucciones de Organización y Funcionamiento (IOF) oficiales de Conselleria para el presente curso escolar <strong>aún no han sido publicadas oficialmente</strong>. El cálculo y la temporalización se realizan de conformidad con las ordenaciones generales de etapa vigentes.
              </p>
            </div>
          </div>

          {/* Warnings List if any */}
          {warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-red-600" /> Conflictos de Planificación
              </h3>
              <ul className="space-y-1.5">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                    <span className="text-red-500 font-extrabold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mode Selector for Programación Anual */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Modo Programación Anual</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setMode("A")}
                className={`p-2.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  mode === "A"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Sólo Temporalización
              </button>
              <button
                type="button"
                onClick={() => setMode("B")}
                className={`p-2.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  mode === "B"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Sólo Texto Justificado
              </button>
              <button
                type="button"
                onClick={() => setMode("C")}
                className={`p-2.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  mode === "C"
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Ambos
              </button>
            </div>
          </div>

          {/* AI Generator section */}
          {(mode === "B" || mode === "C") && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-300" /> Redactor de Programación Anual
                </h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Gemini AI
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed text-justify">
                Genera la justificación formal y pedagógica de la temporalización para incorporarla directamente a su documento oficial de la Programación Anual de Centro.
              </p>

              {selectedReferences.filter((r) => r.status === "loaded").length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> Contexto de Normativa Activo
                  </span>
                  <div className="space-y-1">
                    {selectedReferences
                      .filter((r) => r.status === "loaded")
                      .map((ref) => (
                        <div key={ref.id} className="text-[10px] text-slate-300 truncate">
                          • {ref.name}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {aiText ? (
                <div className="space-y-3">
                  <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto text-slate-200 prose prose-invert">
                    {renderMarkdownText(aiText)}
                  </div>
                  <button
                    onClick={handleGenerateText}
                    disabled={loading}
                    className="w-full py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-lg transition duration-150 hover:bg-slate-750 flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerar Justificación
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateText}
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" /> Redactando propuesta formal...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" /> Generar Texto Justificado
                    </>
                  )}
                </button>
              )}

              {loading && (
                <div className="text-center space-y-1 py-2">
                  <p className="text-[11px] text-amber-300 font-semibold italic">
                    "Trazando coherencia curricular según Decretos de la CV..."
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Esto puede tomar entre 5 y 10 segundos. Por favor, espere.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg leading-relaxed">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="pt-6 border-t border-slate-200 flex justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 border border-slate-200 transition duration-150 flex items-center gap-2 cursor-pointer text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Gestionar SdAs
        </button>
      </div>
    </div>
  );
}
