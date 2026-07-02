import React from "react";
import { ShieldAlert, BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl shadow-inner flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              PlanIA CV
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              SENTIA: SENTIR, ENSEÑAR, TRANSFORMAR
            </p>
          </div>
        </div>

        {/* Permanent Data Protection Notice */}
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 max-w-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <strong className="text-amber-400 block sm:inline">Aviso permanente:</strong> No introduzca datos personales
            del alumnado. PlanIA CV trabaja exclusivamente con información curricular y organizativa.
          </p>
        </div>
      </div>
    </header>
  );
}
