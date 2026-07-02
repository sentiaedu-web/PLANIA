import React from "react";
import { Info, User, Award, ExternalLink } from "lucide-react";

export function AboutSection() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mt-12 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Info className="w-6 h-6 text-slate-700" />
        <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">
          Acerca de PlanIA CV
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Author Portrait/Credits */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/10 p-3 rounded-full text-amber-600 hidden sm:block">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">David Martínez López</h3>
              <p className="text-sm text-slate-600 font-medium">
                Maestro de Educación Primaria &amp; Especialista en Inteligencia Artificial aplicada a la Educación
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-800 text-xs font-semibold rounded-full border border-amber-500/20">
                <Award className="w-3.5 h-3.5" /> Comunitat Valenciana
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            PlanIA CV es una herramienta concebida por un docente para docentes. Nace para simplificar y aportar
            rigor al laborioso proceso de cálculo de sesiones reales disponibles y distribución de Situaciones de
            Aprendizaje (SdA). Se ha diseñado respetando meticulosamente el marco curricular oficial del territorio,
            asegurando la trazabilidad de la planificación sin interferir jamás en el criterio profesional y pedagógico
            del maestro.
          </p>

          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-mono font-semibold">
              Proyecto de referencia
            </p>
            <h4 className="text-base font-bold text-slate-800 mt-1">
              Sentia: Sentir, enseñar, transformar
            </h4>
            <p className="text-slate-600 text-sm mt-1">
              Una iniciativa dedicada a impulsar la transformación educativa a través del diseño pedagógico moderno,
              la educación emocional integradora y la adopción ética y provechosa del potencial de la Inteligencia Artificial.
            </p>
          </div>
        </div>

        {/* Info panel */}
        <div className="md:col-span-4 bg-slate-100/80 p-5 rounded-xl border border-slate-200 space-y-3.5">
          <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
            Ficha del Proyecto
          </h4>
          <div className="space-y-2 text-xs text-slate-600 font-sans">
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span>Nombre:</span>
              <strong className="text-slate-900">PlanIA CV</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span>Versión:</span>
              <strong className="text-slate-900">1.0 (Oficial)</strong>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span>Ámbito:</span>
              <strong className="text-slate-900">Comunitat Valenciana</strong>
            </div>
            <div className="flex justify-between pb-1.5">
              <span>Soporte IA:</span>
              <strong className="text-slate-900">Gemini 3.5 Flash</strong>
            </div>
          </div>

          <div className="bg-amber-500 text-slate-950 px-4 py-3 rounded-lg text-center font-semibold text-xs transition duration-200 hover:bg-amber-400 flex items-center justify-center gap-1.5 cursor-default select-none">
            Proyecto Sentia
          </div>
        </div>
      </div>
    </div>
  );
}
