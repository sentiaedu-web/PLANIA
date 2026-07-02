import React, { useEffect, useState } from "react";
import { SchoolSetup, AppLanguage, SchoolStage } from "../types";
import { ArrowRight, HelpCircle, GraduationCap, Calendar, MapPin } from "lucide-react";

interface SetupFormProps {
  initialSetup: SchoolSetup;
  onSubmit: (setup: SchoolSetup) => void;
}

const CoursePresets: Record<SchoolStage, string[]> = {
  Infantil: ["3 años", "4 años", "5 años"],
  Primaria: ["1.º Primaria", "2.º Primaria", "3.º Primaria", "4.º Primaria", "5.º Primaria", "6.º Primaria"],
};

export function SetupForm({ initialSetup, onSubmit }: SetupFormProps) {
  const [setup, setSetup] = useState<SchoolSetup>(initialSetup);

  // Update course options when stage changes
  useEffect(() => {
    const presets = CoursePresets[setup.stage];
    if (!presets.includes(setup.course)) {
      setSetup((prev) => ({ ...prev, course: presets[0] }));
    }
  }, [setup.stage]);

  const toggleClassDay = (dayIndex: number) => {
    setSetup((prev) => {
      const days = prev.classDays.includes(dayIndex)
        ? prev.classDays.filter((d) => d !== dayIndex)
        : [...prev.classDays, dayIndex].sort();
      return {
        ...prev,
        classDays: days,
        sessionsPerWeek: days.length,
      };
    });
  };

  const handlePresetSelect = (coursePreset: string) => {
    setSetup((prev) => ({ ...prev, course: coursePreset }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setup.classDays.length === 0) {
      alert("Por favor, seleccione al menos un día de la semana con sesión lectiva.");
      return;
    }
    onSubmit(setup);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
      {/* Visual top banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8">
        <span className="text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">Paso 1 de 4</span>
        <h2 className="text-xl sm:text-2xl font-bold mt-1 font-sans tracking-tight">
          Configuración Curricular de la Programación
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
          Introduzca los datos de su asignatura y centro escolar para que PlanIA CV calcule y estructure la temporalización lectiva exacta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Idioma - OBLIGATORIO */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            Idioma de Salida / Idioma de eixida <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "es", label: "Castellano" },
              { id: "ca", label: "Valencià (AVL)" },
              { id: "en", label: "English" },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSetup({ ...setup, language: lang.id as AppLanguage })}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 text-center cursor-pointer ${
                  setup.language === lang.id
                    ? "bg-amber-500 border-amber-500 text-slate-950 shadow-md scale-[1.02]"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Etapa - OBLIGATORIA */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-slate-500" /> Etapa Educativa <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "Infantil", label: "Educación Infantil" },
                { id: "Primaria", label: "Educación Primaria" },
              ].map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSetup({ ...setup, stage: stage.id as SchoolStage })}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    setup.stage === stage.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50"
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curso escolar - OBLIGATORIO */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" /> Curso escolar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 2026-2027"
              value={setup.schoolYear}
              onChange={(e) => setSetup({ ...setup, schoolYear: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
            />
          </div>
        </div>

        {/* Curso / Nivel con Presets */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">
            Curso o nivel <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {CoursePresets[setup.stage].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  setup.course === preset
                    ? "bg-amber-500/10 text-amber-900 border-amber-300"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            required
            placeholder="Escriba el curso si no está en la lista"
            value={setup.course}
            onChange={(e) => setSetup({ ...setup, course: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Área / Materia */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Área o Materia <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Matemáticas, Lengua, Science..."
              value={setup.subject}
              onChange={(e) => setSetup({ ...setup, subject: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
            />
          </div>

          {/* Localidad */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> Localidad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Valencia, Alicante, Castellón..."
              value={setup.locality}
              onChange={(e) => setSetup({ ...setup, locality: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-800 bg-white transition-all text-sm outline-none"
            />
          </div>
        </div>

        {/* Weekly schedule - SUPER CLAVE PARA EL CÁLCULO REAL */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-bold text-slate-800">Horario de clase semanal</h4>
            <div className="relative group cursor-pointer text-slate-400 hover:text-slate-600">
              <HelpCircle className="w-4 h-4" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 leading-relaxed">
                Seleccione en qué días de la semana imparte esta materia. Permite descontar las sesiones con precisión según caigan los días festivos o excursiones.
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Marque los días de la semana en los que tiene sesión lectiva para esta materia:
          </p>

          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 1, label: "Lunes", labelShort: "L" },
              { id: 2, label: "Martes", labelShort: "M" },
              { id: 3, label: "Miércoles", labelShort: "X" },
              { id: 4, label: "Jueves", labelShort: "J" },
              { id: 5, label: "Viernes", labelShort: "V" },
            ].map((day) => {
              const isSelected = setup.classDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleClassDay(day.id)}
                  className={`py-3.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-amber-950 font-bold"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 text-sm"
                  }`}
                >
                  <span className="hidden sm:inline text-sm">{day.label}</span>
                  <span className="inline sm:hidden text-base">{day.labelShort}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200 pt-3">
            <span>Días lectivos seleccionados:</span>
            <strong className="text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
              {setup.classDays.length} {setup.classDays.length === 1 ? "sesión" : "sesiones"} / semana
            </strong>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2 transition duration-200 hover:bg-slate-800 hover:scale-[1.01] cursor-pointer"
          >
            Siguiente: Configurar Calendario <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
