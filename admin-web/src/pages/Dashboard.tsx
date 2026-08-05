import { Users, TrendingUp, HandHeart, Calendar, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
      
      {/* 1. Header (Topo) */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Bem-vindo, Leonardo. Aqui está o resumo de hoje.</p>
        </div>
        <button className="bg-emerald-900 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
          Publicar Aviso
        </button>
      </header>

      {/* 2. Linha 1 - Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Membros Ativos</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-gray-900">432</p>
              <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+12%</p>
            </div>
            {/* Fake Bar Chart */}
            <div className="flex items-end gap-1.5 h-10">
               <div className="w-1.5 bg-emerald-300 rounded-t-sm h-[40%]"></div>
               <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[70%]"></div>
               <div className="w-1.5 bg-gray-200 rounded-t-sm h-[50%]"></div>
               <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[100%]"></div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Dízimos & Ofertas</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-gray-900">R$ 12.450</p>
              <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-max px-2.5 py-1 rounded-full">+5%</p>
            </div>
            <div className="flex items-end gap-1.5 h-10">
               <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[100%]"></div>
               <div className="w-1.5 bg-gray-200 rounded-t-sm h-[30%]"></div>
               <div className="w-1.5 bg-gray-200 rounded-t-sm h-[50%]"></div>
               <div className="w-1.5 bg-emerald-500 rounded-t-sm h-[80%]"></div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Pedidos de Oração</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-gray-900">28</p>
              <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-50 w-max px-2.5 py-1 rounded-full">4 urgentes</p>
            </div>
            <div className="flex items-end gap-1.5 h-10">
               <div className="w-1.5 bg-orange-400 rounded-t-sm h-[60%]"></div>
               <div className="w-1.5 bg-orange-400 rounded-t-sm h-[80%]"></div>
               <div className="w-1.5 bg-orange-400 rounded-t-sm h-[100%]"></div>
               <div className="w-1.5 bg-gray-200 rounded-t-sm h-[40%]"></div>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-500 text-xs font-semibold mb-4 uppercase tracking-wider">Eventos Mês</h3>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-gray-900">14</p>
              <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-50 w-max px-2.5 py-1 rounded-full">2 próximos</p>
            </div>
            <div className="flex items-end gap-1.5 h-10">
               <div className="w-1.5 bg-gray-200 rounded-t-sm h-[100%]"></div>
               <div className="w-1.5 bg-blue-500 rounded-t-sm h-[40%]"></div>
               <div className="w-1.5 bg-blue-500 rounded-t-sm h-[60%]"></div>
               <div className="w-1.5 bg-blue-500 rounded-t-sm h-[90%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Linha 2 - Análise Detalhada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Esquerdo: Próximas Atividades */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-900 text-sm font-bold">Próximas Atividades</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Nesta Semana</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                <span className="text-sm font-black text-emerald-600">24</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Culto de Celebração</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Domingo, 19:00 - Templo</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                <span className="text-sm font-black text-emerald-600">26</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Reunião de Liderança</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Terça, 20:00 - Sala 2</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 w-12 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Ago</span>
                <span className="text-sm font-black text-emerald-600">28</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Culto Jovem</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Quinta, 19:30 - Templo</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 py-2.5 rounded-xl border border-gray-100 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
            Ver Calendário
          </button>
        </div>

        {/* Card Central: Frequência */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-900 text-sm font-bold mb-4">Frequência nos Cultos</h3>
          <div className="text-center my-4">
            <span className="text-6xl font-black text-gray-900 tracking-tighter">86%</span>
          </div>
          
          <ul className="flex flex-col gap-3 mb-6 mt-2">
            <li className="flex justify-between items-center text-sm font-bold">
              <div className="flex items-center gap-2 text-gray-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Domingo
              </div>
              <span className="text-gray-500 font-semibold">52%</span>
            </li>
            <li className="flex justify-between items-center text-sm font-bold">
              <div className="flex items-center gap-2 text-gray-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-200"></span> Quarta
              </div>
              <span className="text-gray-500 font-semibold">22%</span>
            </li>
            <li className="flex justify-between items-center text-sm font-bold">
              <div className="flex items-center gap-2 text-gray-900">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Jovens
              </div>
              <span className="text-gray-500 font-semibold">12%</span>
            </li>
          </ul>

          <button className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors">
            Ver Detalhes
          </button>
        </div>

        {/* Card Direito: Últimas Atividades */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col h-full">
          <h3 className="text-gray-900 text-sm font-bold mb-6">Últimas Atividades</h3>
          <div className="flex-1 flex flex-col gap-5 justify-center">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Novo aviso publicado</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Retiro de Jovens 2026</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Doação confirmada</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">R$ 500 via Pix</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Pedido de oração Urgente</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Enviado por Pr. João</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Culto finalizado</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">142 membros presentes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Linha 3 - Status e Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Barras Horizontais: Células */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-center min-h-[180px]">
          <h3 className="text-gray-900 text-sm font-bold mb-6">Status de Células</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-gray-900">Engajamento Semanal</span>
                <span className="text-xs font-extrabold text-gray-500">89%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-emerald-500 h-3 rounded-full w-[89%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-gray-900">Multiplicação (Meta Anual)</span>
                <span className="text-xs font-extrabold text-gray-500">65%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-500 h-3 rounded-full w-[65%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner CTA */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-3xl p-8 flex flex-col justify-between min-h-[180px] shadow-sm">
          {/* Decorative shapes */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Painel de<br/>Ações Rápidas</h2>
            <p className="text-emerald-100/70 text-xs font-medium max-w-[60%]">Gerencie a comunidade e conecte membros com facilidade.</p>
          </div>

          <div className="relative z-10 flex justify-between items-end mt-6">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=12" alt="Avatar 1" />
              <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=33" alt="Avatar 2" />
              <img className="w-10 h-10 rounded-full border-2 border-emerald-900 bg-emerald-800" src="https://i.pravatar.cc/100?img=47" alt="Avatar 3" />
            </div>
            
            <button className="bg-white hover:bg-gray-50 text-emerald-900 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
