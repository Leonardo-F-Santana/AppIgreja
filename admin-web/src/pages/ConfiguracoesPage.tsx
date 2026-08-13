import { Settings } from 'lucide-react';

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Personalize as preferências do painel administrativo.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <Settings size={28} className="text-slate-600" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-bold text-base">Módulo de Configurações</p>
          <p className="text-gray-400 text-sm font-medium mt-1">Esta seção está sendo desenvolvida e estará disponível em breve.</p>
        </div>
        <span className="mt-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
          Em Breve
        </span>
      </div>
    </div>
  );
}
