import { Heart } from 'lucide-react';

export default function DoacoesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Doações</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Registros de dízimos, ofertas e contribuições.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <Heart size={28} className="text-orange-600" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-bold text-base">Módulo de Doações</p>
          <p className="text-gray-400 text-sm font-medium mt-1">Esta seção está sendo desenvolvida e estará disponível em breve.</p>
        </div>
        <span className="mt-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
          Em Breve
        </span>
      </div>
    </div>
  );
}
